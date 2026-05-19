        let allProducts = [];
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        let currentUser = null;
        let productRatings = JSON.parse(localStorage.getItem('productRatings') || '{}');
        let userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');

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
                const response = await fetch('/products.xml');
                if (!response.ok) throw new Error('Не удалось загрузить products.xml');
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                
                const products = xmlDoc.querySelectorAll('product');
                
                products.forEach(product => {
                    let imageUrl = product.querySelector('image_url')?.textContent || '';
                    let xmlRating = parseFloat(product.querySelector('rating')?.textContent) || 4.0;
                    
                    allProducts.push({
                        id: product.getAttribute('id'),
                        name: product.querySelector('name')?.textContent || '',
                        brand: product.querySelector('brand')?.textContent || '',
                        price: parseInt(product.querySelector('price')?.textContent) || 0,
                        in_stock: product.querySelector('in_stock')?.textContent === 'true',
                        short_description: product.querySelector('short_description')?.textContent || '',
                        full_description: product.querySelector('full_description')?.textContent || '',
                        power_w: product.querySelector('power_w') ? parseInt(product.querySelector('power_w').textContent) : null,
                        color: product.querySelector('color')?.textContent || '',
                        rating: xmlRating,
                        warranty_months: product.querySelector('warranty_months')?.textContent !== 'none' ? parseInt(product.querySelector('warranty_months')?.textContent) : null,
                        weight_kg: parseFloat(product.querySelector('weight_kg')?.textContent) || 0,
                        additional_info: product.querySelector('additional_info')?.textContent || '',
                        image_url: imageUrl
                    });
                });
                
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('id');
                const product = allProducts.find(p => p.id === productId);
                renderProduct(product);
                updateCounters();
                
            } catch (error) {
                document.getElementById('product-content').innerHTML = '<div class="error">Ошибка загрузки. Запустите через Live Server!</div>';
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

        function addToCart(id) {
            const product = allProducts.find(p => p.id === id);
            if (!product || !product.in_stock) { 
                showNotification('Товар временно отсутствует', true); 
                return; 
            }
            if (cart.includes(id)) { 
                showNotification('Товар уже в корзине'); 
                return; 
            }
            cart.push(id);
            saveCart();
            showNotification('Товар добавлен в корзину');
        }

        function toggleFavorite(id) {
            const idx = favorites.indexOf(id);
            if (idx === -1) { 
                favorites.push(id); 
                saveFavorites(); 
                showNotification('Добавлено в избранное'); 
                return true; 
            } else { 
                favorites.splice(idx, 1); 
                saveFavorites(); 
                showNotification('Удалено из избранного'); 
                return false; 
            }
        }

        function isInFavorites(id) { 
            return favorites.includes(id); 
        }

        function showNotification(msg, isError = false) {
            const n = document.createElement('div');
            n.className = 'notification';
            n.textContent = msg;
            if (isError) n.style.backgroundColor = '#c62828';
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 2000);
        }

        function saveProductRating(productId, averageRating, totalVotes) {
            productRatings[productId] = {
                average: averageRating,
                votes: totalVotes
            };
            localStorage.setItem('productRatings', JSON.stringify(productRatings));
        }

        function saveUserRating(productId, rating) {
            if (!currentUser) return;
            
            if (!userRatings[currentUser.phone]) {
                userRatings[currentUser.phone] = {};
            }
            userRatings[currentUser.phone][productId] = rating;
            localStorage.setItem('userRatings', JSON.stringify(userRatings));
        }

        function getUserRating(productId) {
            if (!currentUser) return null;
            return userRatings[currentUser.phone]?.[productId] || null;
        }

        function getProductRating(productId) {
            return productRatings[productId] || null;
        }

        function updateProductRating(productId, newUserRating) {
            const currentRatingData = getProductRating(productId);
            let totalVotes, totalSum;
            
            if (currentRatingData) {
                totalVotes = currentRatingData.votes;
                totalSum = currentRatingData.average * totalVotes;
            } else {
                totalVotes = 0;
                totalSum = 0;
            }
            
            const oldUserRating = getUserRating(productId);
            
            if (oldUserRating !== null) {
                totalSum -= oldUserRating;
                totalVotes--;
            }
            
            totalSum += newUserRating;
            totalVotes++;
            
            const newAverage = totalSum / totalVotes;
            
            saveProductRating(productId, newAverage, totalVotes);
            saveUserRating(productId, newUserRating);
            
            return newAverage;
        }

        function renderStars(rating, interactive = true, containerId = null) {
            const starsContainer = document.createElement('div');
            starsContainer.className = 'star-rating';
            
            for (let i = 1; i <= 5; i++) {
                const starBtn = document.createElement('button');
                starBtn.className = 'star-btn';
                starBtn.setAttribute('data-value', i);
                
                const starImg = document.createElement('img');
                if (i <= rating) {
                    starImg.src = 'star-filled.svg';
                    starImg.alt = 'заполненная звезда';
                } else {
                    starImg.src = 'star-empty.svg';
                    starImg.alt = 'пустая звезда';
                }
                starImg.className = 'star-icon';
                starImg.onerror = function() {
                    this.style.display = 'none';
                    starBtn.textContent = i <= rating ? '★' : '☆';
                    starBtn.style.fontSize = '28px';
                    starBtn.style.color = '#ffc107';
                    starBtn.style.background = 'none';
                    starBtn.style.border = 'none';
                    starBtn.style.cursor = 'pointer';
                };
                
                starBtn.appendChild(starImg);
                
                if (interactive) {
                    starBtn.addEventListener('click', (function(value) {
                        return function() { handleRating(value); };
                    })(i));
                    
                    starBtn.addEventListener('mouseenter', (function(value) {
                        return function() { highlightStars(value); };
                    })(i));
                }
                
                starsContainer.appendChild(starBtn);
            }
            
            if (containerId) {
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = '';
                    container.appendChild(starsContainer);
                }
            }
            
            return starsContainer;
        }

        function highlightStars(rating) {
            const stars = document.querySelectorAll('#interactive-stars .star-btn');
            stars.forEach((star, index) => {
                const img = star.querySelector('.star-icon');
                if (index < rating) {
                    if (img) {
                        img.src = 'star-filled.svg';
                        img.alt = 'заполненная звезда';
                    } else {
                        star.textContent = '★';
                    }
                } else {
                    if (img) {
                        img.src = 'star-empty.svg';
                        img.alt = 'пустая звезда';
                    } else {
                        star.textContent = '☆';
                    }
                }
            });
        }

        function resetStars(rating) {
            const stars = document.querySelectorAll('#interactive-stars .star-btn');
            stars.forEach((star, index) => {
                const img = star.querySelector('.star-icon');
                if (index < rating) {
                    if (img) {
                        img.src = 'star-filled.svg';
                        img.alt = 'заполненная звезда';
                    } else {
                        star.textContent = '★';
                    }
                } else {
                    if (img) {
                        img.src = 'star-empty.svg';
                        img.alt = 'пустая звезда';
                    } else {
                        star.textContent = '☆';
                    }
                }
            });
        }

        function handleRating(value) {
            if (!currentUser) {
                showNotification('Войдите в аккаунт, чтобы оценить товар', true);
                return;
            }
            
            const productId = getCurrentProductId();
            if (!productId) return;
            
            const newAverage = updateProductRating(productId, value);
            
            ratingUpdateCallback(value, newAverage);
            
            showNotification('Спасибо за вашу оценку!');
        }

        let currentProductId = null;
        
        function getCurrentProductId() {
            return currentProductId;
        }
        
        function setCurrentProductId(id) {
            currentProductId = id;
        }
        
        let ratingUpdateCallback = null;

        function renderProduct(product) {
            const container = document.getElementById('product-content');
            if (!product) { 
                container.innerHTML = '<div class="error">Товар не найден</div>'; 
                return; 
            }
            
            setCurrentProductId(product.id);
            
            const userRating = getUserRating(product.id);
            const productRatingData = getProductRating(product.id);
            const displayRating = productRatingData ? productRatingData.average : product.rating;
            const votesCount = productRatingData ? productRatingData.votes : 0;
            
            const isFav = isInFavorites(product.id);
            const heartIcon = isFav ? 'heart-icon-white.svg' : 'heart-icon.svg';
            
            let imageHtml = '';
            if (product.image_url && product.image_url.trim() !== '') {
                imageHtml = `<img src="${product.image_url}" alt="${product.name}" class="product-detail-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
                imageHtml += `<div class="image-placeholder-large" style="display: none;">${product.name.substring(0, 30)}</div>`;
            } else {
                imageHtml = `<div class="image-placeholder-large">${product.name.substring(0, 30)}</div>`;
            }
            
            container.innerHTML = `
                <div class="product-detail-layout">
                    <div class="product-image-large">
                        ${imageHtml}
                        <div class="product-price-wrapper">
                            <div class="product-price">${product.price.toLocaleString()} ₽</div>
                        </div>
                        <div class="product-description-wrapper">
                            <h3>Описание</h3>
                            <p>${product.full_description || product.short_description}</p>
                        </div>
                        <div class="product-rating-wrapper">
                            <div class="display-stars" id="display-stars-${product.id}"></div>
                            <div class="average-rating" id="average-rating-${product.id}">Рейтинг: ${displayRating.toFixed(1)} (${votesCount} оценок)</div>
                        </div>
                    </div>
                    <div class="product-info">
                        <h1>${product.name}</h1>
                        <div class="product-brand">${product.brand}</div>
                        <div class="stock-status ${product.in_stock ? 'in-stock' : 'out-of-stock'}">
                            ${product.in_stock ? 'В наличии' : 'Нет в наличии'}
                        </div>
                        <div class="product-rating-section">
                            <span class="rating-label">Оцените товар:</span>
                            <div class="stars-container">
                                <div id="interactive-stars-${product.id}"></div>
                                <span class="rating-value" id="rating-value-${product.id}">${userRating ? 'Ваша оценка: ' + userRating : 'Не оценено'}</span>
                            </div>
                        </div>
                        <div class="product-specs">
                            <h3>Характеристики</h3>
                            <ul class="specs-list">
                                <li><span class="spec-label">Бренд:</span><span class="spec-value">${product.brand}</span></li>
                                <li><span class="spec-label">Цвет:</span><span class="spec-value">${product.color}</span></li>
                                <li><span class="spec-label">Вес:</span><span class="spec-value">${product.weight_kg} кг</span></li>
                                ${product.warranty_months ? `<li><span class="spec-label">Гарантия:</span><span class="spec-value">${product.warranty_months} мес.</span></li>` : ''}
                                ${product.power_w ? `<li><span class="spec-label">Мощность:</span><span class="spec-value">${product.power_w} Вт</span></li>` : ''}
                                ${product.additional_info ? `<li><span class="spec-label">Дополнительно:</span><span class="spec-value">${product.additional_info}</span></li>` : ''}
                            </ul>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-add-to-cart" id="addToCartBtn" ${!product.in_stock ? 'disabled' : ''}>
                                ${product.in_stock ? 'В корзину' : 'Нет в наличии'}
                            </button>
                            <button class="btn-add-to-favorites ${isFav ? 'active' : ''}" id="favBtn">
                                <img src="${heartIcon}" alt="избранное" class="heart-icon" onerror="this.style.display='none'">
                                ${isFav ? 'В избранном' : 'В избранное'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            renderDisplayStars(product.id, displayRating);
            
            const interactiveContainer = document.getElementById(`interactive-stars-${product.id}`);
            if (interactiveContainer) {
                renderStars(userRating || 0, true, `interactive-stars-${product.id}`);
            }
            
            ratingUpdateCallback = (newUserRating, newAverage) => {
                const ratingValueSpan = document.getElementById(`rating-value-${product.id}`);
                if (ratingValueSpan) {
                    ratingValueSpan.textContent = `Ваша оценка: ${newUserRating}`;
                }
                
                renderDisplayStars(product.id, newAverage);
                
                const averageSpan = document.getElementById(`average-rating-${product.id}`);
                const productRatingDataNew = getProductRating(product.id);
                if (averageSpan && productRatingDataNew) {
                    averageSpan.textContent = `Рейтинг: ${productRatingDataNew.average.toFixed(1)} (${productRatingDataNew.votes} оценок)`;
                }
                
                const interactiveContainerRefresh = document.getElementById(`interactive-stars-${product.id}`);
                if (interactiveContainerRefresh) {
                    renderStars(newUserRating, true, `interactive-stars-${product.id}`);
                }
            };
            
            document.getElementById('addToCartBtn')?.addEventListener('click', () => product.in_stock && addToCart(product.id));
            
            const favBtn = document.getElementById('favBtn');
            if (favBtn) {
                favBtn.addEventListener('click', () => {
                    const isNowFav = toggleFavorite(product.id);
                    const newIcon = isNowFav ? 'heart-icon-white.svg' : 'heart-icon.svg';
                    favBtn.innerHTML = `<img src="${newIcon}" alt="избранное" class="heart-icon" onerror="this.style.display='none'"> ${isNowFav ? 'В избранном' : 'В избранное'}`;
                    favBtn.classList.toggle('active', isNowFav);
                });
            }
        }
        
        function renderDisplayStars(productId, rating) {
            const container = document.getElementById(`display-stars-${productId}`);
            if (!container) return;
            
            container.innerHTML = '';
            container.className = 'display-stars';
            
            for (let i = 1; i <= 5; i++) {
                const starImg = document.createElement('img');
                if (i <= Math.round(rating)) {
                    starImg.src = 'star-filled.svg';
                    starImg.alt = 'заполненная звезда';
                } else {
                    starImg.src = 'star-empty.svg';
                    starImg.alt = 'пустая звезда';
                }
                starImg.className = 'display-star-icon';
                starImg.onerror = function() {
                    this.style.display = 'none';
                    const starSpan = document.createElement('span');
                    starSpan.textContent = i <= Math.round(rating) ? '★' : '☆';
                    starSpan.style.fontSize = '20px';
                    starSpan.style.color = '#ffc107';
                    container.appendChild(starSpan);
                };
                container.appendChild(starImg);
            }
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