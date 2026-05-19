        let allProducts = [];
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        let currentUser = null;

        function loadUser() {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
            }
            updateAccountUI();
        }

        function updateAccountUI() {
            const accountText = document.getElementById('account-text');
            if (accountText) {
                if (currentUser) {
                    accountText.textContent = currentUser.phone;
                } else {
                    accountText.textContent = 'аккаунт';
                }
            }
        }

        async function loadProductsFromXML() {
            try {
                const response = await fetch('products.xml');
                if (!response.ok) {
                    throw new Error('Не удалось загрузить products.xml');
                }
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                
                const products = xmlDoc.querySelectorAll('product');
                const productsArray = [];
                
                products.forEach(product => {
                    let imageUrl = product.querySelector('image_url')?.textContent || '';
                    
                    productsArray.push({
                        id: product.getAttribute('id'),
                        name: product.querySelector('name')?.textContent || '',
                        brand: product.querySelector('brand')?.textContent || '',
                        price: parseInt(product.querySelector('price')?.textContent) || 0,
                        in_stock: product.querySelector('in_stock')?.textContent === 'true',
                        short_description: product.querySelector('short_description')?.textContent || '',
                        full_description: product.querySelector('full_description')?.textContent || '',
                        power_w: product.querySelector('power_w') ? parseInt(product.querySelector('power_w').textContent) : null,
                        color: product.querySelector('color')?.textContent || '',
                        rating: parseFloat(product.querySelector('rating')?.textContent) || 4.0,
                        warranty_months: product.querySelector('warranty_months')?.textContent !== 'none' ? parseInt(product.querySelector('warranty_months')?.textContent) : null,
                        weight_kg: parseFloat(product.querySelector('weight_kg')?.textContent) || 0,
                        additional_info: product.querySelector('additional_info')?.textContent || '',
                        image_url: imageUrl
                    });
                });
                
                allProducts = productsArray;
                updateCounters();
                renderFavorites();
                
            } catch (error) {
                console.error('Ошибка загрузки XML:', error);
                document.getElementById('favorites-content').innerHTML = `
                    <div class="error">
                        <p>Ошибка загрузки товаров</p>
                        <p style="font-size: 14px; margin-top: 10px;">Убедитесь, что файл products.xml существует и запустите проект через Live Server</p>
                        <a href="main.html" style="color: #ff6b35; display: inline-block; margin-top: 20px;">← Вернуться на главную</a>
                    </div>
                `;
            }
        }

        function updateCounters() {
            document.getElementById('cart-count').textContent = cart.length;
            document.getElementById('fav-count').textContent = favorites.length;
        }

        function saveCart() {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCounters();
        }

        function saveFavorites() {
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateCounters();
        }

        function showNotification(message, isError = false) {
            const notif = document.createElement('div');
            notif.className = 'notification';
            notif.textContent = message;
            if (isError) {
                notif.style.backgroundColor = '#c62828';
            }
            document.body.appendChild(notif);
            setTimeout(() => {
                notif.remove();
            }, 2000);
        }

        function addToCart(productId) {
            const product = allProducts.find(p => p.id === productId);
            if (!product || !product.in_stock) {
                showNotification('Товар временно отсутствует', true);
                return;
            }
            if (cart.includes(productId)) {
                showNotification('Товар уже в корзине');
                return;
            }
            cart.push(productId);
            saveCart();
            showNotification('Товар добавлен в корзину');
            renderFavorites();
        }

        function removeFromFavorites(productId) {
            const index = favorites.indexOf(productId);
            if (index !== -1) {
                favorites.splice(index, 1);
                saveFavorites();
                showNotification('Удалено из избранного');
                renderFavorites();
            }
        }

        function getProductById(id) {
            return allProducts.find(p => p.id === id);
        }

        function renderFavorites() {
            const container = document.getElementById('favorites-content');
            
            if (favorites.length === 0) {
                container.innerHTML = `
                    <div class="empty-favorites">
                        <h2>Избранное пусто</h2>
                        <p>Добавляйте товары в избранное, чтобы не потерять понравившиеся</p>
                        <a href="main.html" class="continue-shopping">Перейти в каталог</a>
                    </div>
                `;
                return;
            }
            
            const favoriteProducts = favorites
                .map(id => getProductById(id))
                .filter(p => p);
            
            if (favoriteProducts.length === 0) {
                container.innerHTML = `
                    <div class="empty-favorites">
                        <h2>Избранное пусто</h2>
                        <a href="main.html" class="continue-shopping">Перейти в каталог</a>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="favorites-grid">
                    ${favoriteProducts.map(product => {
                        let imageHtml = '';
                        if (product.image_url && product.image_url.trim() !== '') {
                            imageHtml = `<img src="${product.image_url}" alt="${product.name}" class="favorite-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
                            imageHtml += `<div class="favorite-card-placeholder" style="display: none;">${product.name.substring(0, 20)}</div>`;
                        } else {
                            imageHtml = `<div class="favorite-card-placeholder">${product.name.substring(0, 20)}</div>`;
                        }
                        
                        return `
                            <div class="favorite-card" data-id="${product.id}">
                                <div class="favorite-card-image-wrapper">
                                    ${imageHtml}
                                </div>
                                <div class="favorite-card-name">${product.name}</div>
                                <div class="favorite-card-brand">${product.brand}</div>
                                <div class="favorite-card-price">${product.price.toLocaleString()} ₽</div>
                                <div class="favorite-card-actions">
                                    <button class="add-to-cart-fav-btn" data-id="${product.id}" ${!product.in_stock ? 'disabled' : ''}>
                                        ${product.in_stock ? 'В корзину' : 'Нет в наличии'}
                                    </button>
                                    <button class="remove-fav-btn" data-id="${product.id}">Удалить</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            document.querySelectorAll('.favorite-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    const id = card.dataset.id;
                    window.location.href = `shopping_card.html?id=${id}`;
                });
            });
            
            document.querySelectorAll('.add-to-cart-fav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    addToCart(id);
                });
            });
            
            document.querySelectorAll('.remove-fav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    removeFromFavorites(id);
                });
            });
        }

        document.getElementById('search-btn')?.addEventListener('click', () => {
            const query = document.getElementById('search-input').value.trim();
            if (query) {
                window.location.href = `main.html?search=${encodeURIComponent(query)}`;
            } else {
                showNotification('Введите запрос для поиска');
            }
        });
        
        document.getElementById('search-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('search-btn').click();
            }
        });
        
        document.querySelector('.banner-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Акции и распродажи (демо-режим)');
        });
        
        document.querySelectorAll('.footer-section a[href="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showNotification('Раздел в разработке');
            });
        });
        
        const accountBtn = document.getElementById('account-btn');
        if (accountBtn) {
            accountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentUser) {
                    window.location.href = 'account.html';
                } else {
                    window.location.href = 'main.html';
                }
            });
        }
        
        loadUser();
        loadProductsFromXML();