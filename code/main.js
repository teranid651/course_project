        let allProducts = [];
        let filteredProducts = [];
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

        function saveCurrentUser(user) {
            currentUser = user;
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
            } else {
                localStorage.removeItem('currentUser');
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

        function getUsers() {
            const users = localStorage.getItem('users');
            return users ? JSON.parse(users) : [];
        }

        function saveUsers(users) {
            localStorage.setItem('users', JSON.stringify(users));
        }

        function validatePhone(phone) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
            return phoneRegex.test(phone);
        }

        function validatePassword(password) {
            return password.length >= 4;
        }

        function register() {
            const phone = document.getElementById('reg-phone').value.trim();
            const password = document.getElementById('reg-password').value;
            const passwordConfirm = document.getElementById('reg-password-confirm').value;
            const errorEl = document.getElementById('reg-error');
            
            if (!validatePhone(phone)) {
                errorEl.textContent = 'Введите корректный номер телефона';
                errorEl.style.display = 'block';
                return;
            }
            
            if (!validatePassword(password)) {
                errorEl.textContent = 'Пароль должен содержать не менее 4 символов';
                errorEl.style.display = 'block';
                return;
            }
            
            if (password !== passwordConfirm) {
                errorEl.textContent = 'Пароли не совпадают';
                errorEl.style.display = 'block';
                return;
            }
            
            const users = getUsers();
            if (users.find(u => u.phone === phone)) {
                errorEl.textContent = 'Пользователь с таким номером уже существует';
                errorEl.style.display = 'block';
                return;
            }
            
            const newUser = {
                phone: phone,
                password: password,
                registeredDate: new Date().toLocaleDateString('ru-RU')
            };
            
            users.push(newUser);
            saveUsers(users);
            saveCurrentUser({ phone: phone, registeredDate: newUser.registeredDate });
            
            closeModal();
            showNotification('Регистрация прошла успешно!');
            
            document.getElementById('reg-phone').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
        }

        function login() {
            const phone = document.getElementById('login-phone').value.trim();
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');
            
            const users = getUsers();
            const user = users.find(u => u.phone === phone && u.password === password);
            
            if (user) {
                saveCurrentUser({ phone: user.phone, registeredDate: user.registeredDate });
                closeModal();
                showNotification('Добро пожаловать!');
                document.getElementById('login-phone').value = '';
                document.getElementById('login-password').value = '';
            } else {
                errorEl.textContent = 'Неверный номер телефона или пароль';
                errorEl.style.display = 'block';
            }
        }

        function logout() {
            saveCurrentUser(null);
            showNotification('Вы вышли из аккаунта');
        }

        function openModal() {
            const modal = document.getElementById('auth-modal');
            modal.classList.add('active');
            showLoginForm();
        }

        function closeModal() {
            const modal = document.getElementById('auth-modal');
            modal.classList.remove('active');
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('reg-error').style.display = 'none';
        }

        function showLoginForm() {
            document.getElementById('auth-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('modal-title').textContent = 'Вход в аккаунт';
            document.getElementById('login-error').style.display = 'none';
        }

        function showRegisterForm() {
            document.getElementById('auth-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
            document.getElementById('modal-title').textContent = 'Регистрация';
            document.getElementById('reg-error').style.display = 'none';
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
                    const name = product.querySelector('name')?.textContent || '';
                    let category = "разное";
                    
                    if (name.toLowerCase().includes('чайник')) category = "чайники";
                    else if (name.toLowerCase().includes('микроволнов') || name.toLowerCase().includes('печь')) category = "микроволновки";
                    else if (name.toLowerCase().includes('пылесос')) category = "пылесосы";
                    else if (name.toLowerCase().includes('утюг')) category = "утюги";
                    else if (name.toLowerCase().includes('холодильник')) category = "холодильники";
                    else if (name.toLowerCase().includes('морозильный')) category = "холодильники";
                    else if (name.toLowerCase().includes('фен')) category = "фены";
                    else if (name.toLowerCase().includes('тостер')) category = "тостеры";
                    else if (name.toLowerCase().includes('мультиварка')) category = "мультиварки";
                    else if (name.toLowerCase().includes('скороварка')) category = "мультиварки";
                    else if (name.toLowerCase().includes('кастрюль') || 
                             name.toLowerCase().includes('сковорода') || 
                             name.toLowerCase().includes('блендер') ||
                             name.toLowerCase().includes('набор для специй') ||
                             name.toLowerCase().includes('весы') ||
                             name.toLowerCase().includes('контейнер') ||
                             name.toLowerCase().includes('бутылка') ||
                             name.toLowerCase().includes('подставка')) category = "посуда";
                    
                    let imageUrl = product.querySelector('image_url')?.textContent || '';
                    
                    allProducts.push({
                        id: product.getAttribute('id'),
                        name: name,
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
                        category: category,
                        image_url: imageUrl
                    });
                });
                
                loadStorage();
                filteredProducts = [...allProducts];
                renderProducts(filteredProducts);
                updateCounters();
                
            } catch (error) {
                console.error(error);
                document.getElementById('products-grid').innerHTML = '<div class="error">Ошибка загрузки товаров. Убедитесь, что файл products.xml существует и вы используете Live Server.</div>';
            }
        }

        function loadStorage() {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) cart = JSON.parse(savedCart);
            
            const savedFavorites = localStorage.getItem('favorites');
            if (savedFavorites) favorites = JSON.parse(savedFavorites);
        }

        function saveCart() {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCounters();
        }

        function saveFavorites() {
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateCounters();
        }

        function updateCounters() {
            const cartCountElem = document.getElementById('cart-count');
            const favCountElem = document.getElementById('fav-count');
            if (cartCountElem) cartCountElem.textContent = cart.length;
            if (favCountElem) favCountElem.textContent = favorites.length;
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
            if (!product) return;
            
            if (!product.in_stock) {
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
            renderProducts(filteredProducts);
        }

        function toggleFavorite(productId) {
            const index = favorites.indexOf(productId);
            if (index === -1) {
                favorites.push(productId);
                saveFavorites();
                showNotification('Добавлено в избранное');
            } else {
                favorites.splice(index, 1);
                saveFavorites();
                showNotification('Удалено из избранного');
            }
            renderProducts(filteredProducts);
        }

        function isInFavorites(productId) {
            return favorites.includes(productId);
        }

        function renderProducts(products) {
            const grid = document.getElementById('products-grid');
            
            if (!products.length) {
                grid.innerHTML = '<div class="error">Товары не найдены</div>';
                return;
            }
            
            grid.innerHTML = products.map(product => {
                const isFav = isInFavorites(product.id);
                const heartIcon = isFav ? 'heart-icon-white.svg' : 'heart-icon.svg';
                
                let imageHtml = '';
                if (product.image_url && product.image_url.trim() !== '') {
                    imageHtml = `<img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
                    imageHtml += `<div class="image-placeholder" style="display: none;">${product.name.substring(0, 25)}</div>`;
                } else {
                    imageHtml = `<div class="image-placeholder">${product.name.substring(0, 25)}</div>`;
                }
                
                return `
                    <div class="product-card" data-id="${product.id}">
                        ${imageHtml}
                        <div class="product-name">${product.name}</div>
                        <div class="product-brand">${product.brand}</div>
                        <div class="product-price">${product.price.toLocaleString()} ₽</div>
                        <div class="${product.in_stock ? 'in-stock' : 'out-of-stock'}">
                            ${product.in_stock ? 'В наличии' : 'Нет в наличии'}
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn-add-to-cart" data-id="${product.id}" ${!product.in_stock ? 'disabled' : ''}>
                                ${product.in_stock ? 'В корзину' : 'Нет в наличии'}
                            </button>
                            <button class="btn-add-to-favorites ${isFav ? 'active' : ''}" data-id="${product.id}">
                                <img src="${heartIcon}" alt="избранное" class="heart-icon" onerror="this.style.display='none'">
                                ${isFav ? 'В избранном' : 'В избранное'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') return;
                    const id = card.dataset.id;
                    window.location.href = `shopping_card.html?id=${id}`;
                });
            });
            
            document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    addToCart(id);
                });
            });
            
            document.querySelectorAll('.btn-add-to-favorites').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    toggleFavorite(id);
                });
            });
        }

        function filterProducts(category, searchQuery) {
            let filtered = [...allProducts];
            
            if (category && category !== 'all' && category !== '') {
                filtered = filtered.filter(p => p.category === category);
            }
            
            if (searchQuery && searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase().trim();
                filtered = filtered.filter(p => 
                    p.name.toLowerCase().includes(q) || 
                    p.brand.toLowerCase().includes(q)
                );
            }
            
            filteredProducts = filtered;
            renderProducts(filteredProducts);
            
            const titleElem = document.getElementById('section-title');
            if (searchQuery && searchQuery.trim() !== '') {
                titleElem.textContent = `Поиск: "${searchQuery}"`;
            } else if (category && category !== 'all' && category !== '') {
                titleElem.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            } else {
                titleElem.textContent = 'Все товары';
            }
        }

        function initEventHandlers() {
            const searchBtn = document.getElementById('search-btn');
            const searchInput = document.getElementById('search-input');
            
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    const query = searchInput.value;
                    filterProducts(null, query);
                });
            }
            
            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const query = searchInput.value;
                        filterProducts(null, query);
                    }
                });
            }
            
            const navLinks = document.querySelectorAll('#nav a');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const categoryText = link.textContent.trim().toLowerCase();
                    
                    if (searchInput) searchInput.value = '';
                    
                    filterProducts(categoryText, null);
                });
            });
            
            const bannerBtn = document.querySelector('.banner-btn');
            if (bannerBtn) {
                bannerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showNotification('Акции и распродажи (демо-режим)');
                });
            }
            
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
                        openModal();
                    }
                });
            }
            
            document.getElementById('close-modal')?.addEventListener('click', closeModal);
            document.getElementById('close-modal-reg')?.addEventListener('click', closeModal);
            document.getElementById('switch-to-register')?.addEventListener('click', showRegisterForm);
            document.getElementById('switch-to-login')?.addEventListener('click', showLoginForm);
            document.getElementById('submit-login')?.addEventListener('click', login);
            document.getElementById('submit-register')?.addEventListener('click', register);
            
            document.getElementById('auth-modal')?.addEventListener('click', (e) => {
                if (e.target === document.getElementById('auth-modal')) {
                    closeModal();
                }
            });
        }

        function checkUrlParams() {
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            if (searchQuery) {
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = searchQuery;
                filterProducts(null, searchQuery);
            }
        }
        
        loadUser();
        loadProductsFromXML().then(() => {
            initEventHandlers();
            checkUrlParams();
        });