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
                if (!response.ok) throw new Error('Не удалось загрузить products.xml');
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                
                const products = xmlDoc.querySelectorAll('product');
                products.forEach(product => {
                    let imageUrl = product.querySelector('image_url')?.textContent || '';
                    
                    allProducts.push({
                        id: product.getAttribute('id'),
                        name: product.querySelector('name')?.textContent || '',
                        brand: product.querySelector('brand')?.textContent || '',
                        price: parseInt(product.querySelector('price')?.textContent) || 0,
                        in_stock: product.querySelector('in_stock')?.textContent === 'true',
                        image_url: imageUrl
                    });
                });
                
                updateCounters();
                renderCart();
                
            } catch (error) {
                document.getElementById('cart-content').innerHTML = '<div class="error">Ошибка загрузки. Запустите через Live Server!</div>';
            }
        }

        function updateCounters() {
            const cartCount = document.getElementById('cart-count');
            const favCount = document.getElementById('fav-count');
            if (cartCount) cartCount.textContent = cart.length;
            if (favCount) favCount.textContent = favorites.length;
        }

        function getProductById(id) { 
            return allProducts.find(p => p.id === id); 
        }

        function removeFromCart(id) {
            const idx = cart.indexOf(id);
            if (idx !== -1) { 
                cart.splice(idx, 1); 
                localStorage.setItem('cart', JSON.stringify(cart)); 
                updateCounters(); 
                renderCart(); 
                showNotification('Товар удален из корзины'); 
            }
        }

        function showNotification(msg, isError = false) {
            const n = document.createElement('div');
            n.className = 'notification';
            n.textContent = msg;
            if (isError) n.style.backgroundColor = '#c62828';
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 2000);
        }

        function renderCart() {
            const container = document.getElementById('cart-content');
            if (cart.length === 0) {
                container.innerHTML = `
                    <div class="empty-cart">
                        <h2>Ваша корзина пуста</h2>
                        <p>Добавьте товары из каталога</p>
                        <a href="main.html" class="continue-shopping">Перейти в каталог</a>
                    </div>
                `;
                return;
            }
            
            const items = cart.map(id => getProductById(id)).filter(p => p);
            const total = items.reduce((s, i) => s + i.price, 0);
            
            container.innerHTML = `
                <div class="cart-items">
                    ${items.map(item => {
                        let imageHtml = '';
                        if (item.image_url && item.image_url.trim() !== '') {
                            imageHtml = `<img src="${item.image_url}" alt="${item.name}" class="cart-item-image" onerror="this.style.display='none'">`;
                        } else {
                            imageHtml = `<div class="cart-item-placeholder">${item.name.substring(0, 20)}</div>`;
                        }
                        
                        return `
                            <div class="cart-item">
                                <div class="cart-item-image-wrapper">
                                    ${imageHtml}
                                </div>
                                <div class="cart-item-info">
                                    <div class="cart-item-name" data-id="${item.id}">${item.name}</div>
                                    <div class="cart-item-brand">${item.brand}</div>
                                </div>
                                <div class="cart-item-price">${item.price.toLocaleString()} ₽</div>
                                <div class="cart-item-actions">
                                    <button class="remove-btn" data-id="${item.id}">Удалить</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="cart-summary">
                    <div class="cart-total">Итого: <span>${total.toLocaleString()} ₽</span></div>
                    <button class="checkout-btn" id="checkoutBtn">Оформить заказ</button>
                </div>
            `;
            
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
            });
            
            document.querySelectorAll('.cart-item-name').forEach(nameEl => {
                nameEl.addEventListener('click', () => window.location.href = `shopping_card.html?id=${nameEl.dataset.id}`);
            });
            
            document.getElementById('checkoutBtn')?.addEventListener('click', () => showNotification('Спасибо за заказ! (демо-режим)', false));
        }

        document.getElementById('search-btn')?.addEventListener('click', () => {
            const q = document.getElementById('search-input')?.value;
            if (q) window.location.href = `main.html?search=${encodeURIComponent(q)}`;
        });
        
        document.getElementById('search-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const q = e.target.value;
                if (q) window.location.href = `main.html?search=${encodeURIComponent(q)}`;
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