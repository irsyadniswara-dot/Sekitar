// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Function to load header and footer
    const loadHeaderFooter = () => {
        const headerPlaceholder = document.getElementById('header-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (headerPlaceholder) {
            fetch('header.html')
                .then(response => response.text())
                .then(data => {
                    headerPlaceholder.innerHTML = data;
                });
        }

        if (footerPlaceholder) {
            fetch('footer.html')
                .then(response => response.text())
                .then(data => {
                    footerPlaceholder.innerHTML = data;
                });
        }
    };

    // Load them on DOM content loaded
    loadHeaderFooter();

    const API_URL = 'http://localhost:3000'; // URL backend server Anda

    // Clear all products from localStorage when the page loads to ensure an empty state
    // This is for development/testing purposes to easily reset product data.
    // localStorage.removeItem('products');

    // Logika untuk halaman utama (menampilkan produk)
    if (document.getElementById('productGrid') && (window.location.pathname.includes('index.html') || window.location.pathname === '/')) {
        const productGrid = document.getElementById('productGrid');
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortOrder = document.getElementById('sortOrder');
        const noResultsMessage = document.getElementById('noResultsMessage');

        let allProducts = []; // Array untuk menyimpan semua produk

        const loadProducts = async () => {
            showSkeletonLoaders();
            let productsFromStorage = JSON.parse(localStorage.getItem('products'));

            if (!productsFromStorage || productsFromStorage.length === 0) {
                // If localStorage is empty, use initial data from data.js
                // 'products' is available globally from data.js
                productsFromStorage = products;
                localStorage.setItem('products', JSON.stringify(productsFromStorage));
            }
            allProducts = productsFromStorage; // Use localStorage data initially

            try {
                const response = await fetch(`${API_URL}/products`);
                if (!response.ok) {
                    // If API fails, check if it's a 404 or network error.
                    // For now, if API fails, we continue with localStorage data.
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const apiProducts = await response.json();
                if (apiProducts && apiProducts.length > 0) {
                    allProducts = apiProducts;
                    localStorage.setItem('products', JSON.stringify(allProducts)); // Update localStorage with fresh API data
                }
                renderProducts(allProducts);
            } catch (error) {
                console.warn("Gagal memuat produk dari API, menggunakan data dari localStorage.", error);
                renderProducts(allProducts); // Render with data from localStorage
            }
        };

        const renderProducts = (productsToRender) => {
            productGrid.innerHTML = ''; // Hapus skeleton atau produk lama
            if (productsToRender.length === 0) {
                noResultsMessage.style.display = 'block';
                return;
            }
            noResultsMessage.style.display = 'none';

            productsToRender.forEach(product => {
                const productCard = document.createElement('a');
                // Arahkan ke detail.html dengan ID dari database
                productCard.href = `detail.html?id=${product.id}`;
                productCard.classList.add('product-card');
                
                // Gunakan properti dari API (image_url, name, price, dll)
                // Perhatikan: 'location' dan 'category' tidak ada di skema DB baru,
                // Anda bisa menambahkannya jika perlu. Untuk sekarang, kita hilangkan.
                productCard.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}">
                    <div class="product-card-content">
                        <h3>${product.name}</h3>
                        <p class="price">Rp ${product.price.toLocaleString('id-ID')}</p>
                    </div>
                `;
                productGrid.appendChild(productCard);
            });
        };

        const showSkeletonLoaders = () => {
            productGrid.innerHTML = Array(8).fill('').map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-card-image"></div>
                    <div class="skeleton-card-content">
                        <div class="skeleton-line title"></div>
                        <div class="skeleton-line price"></div>
                    </div>
                </div>
            `).join('');
            noResultsMessage.style.display = 'none';
        };

        const applyFiltersAndSort = () => {
            let filtered = [...allProducts];

            // Filter Pencarian
            const searchTerm = searchInput.value.toLowerCase();
            if (searchTerm) {
                filtered = filtered.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm))
                );
            }
            
            // Anda bisa menambahkan kembali filter kategori jika sudah menambahkannya di DB
            // const selectedCategory = categoryFilter.value;
            // if (selectedCategory) {
            //     filtered = filtered.filter(product => product.category === selectedCategory);
            // }

            // Urutkan
            const currentSortOrder = sortOrder.value;
            if (currentSortOrder === 'asc') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (currentSortOrder === 'desc') {
                filtered.sort((a, b) => b.price - a.price);
            }

            renderProducts(filtered);
        };

        // Event Listeners
        searchInput.addEventListener('input', applyFiltersAndSort);
        // categoryFilter.addEventListener('change', applyFiltersAndSort); // Non-aktifkan sementara
        sortOrder.addEventListener('change', applyFiltersAndSort);

        // Muat produk saat halaman dibuka
        loadProducts();
    }

    // Logika untuk halaman 'jual.html' (form tambah produk)
    if (document.getElementById('productForm')) {
        const productForm = document.getElementById('productForm');
        productForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Mencegah form submit secara default

            const submitButton = productForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Mengunggah...';

            // Ambil data dari form
            const formData = new FormData(productForm);
            const productData = {
                name: formData.get('name'),
                price: parseInt(formData.get('price'), 10),
                description: formData.get('description'),
                // PENTING: Untuk upload gambar, logika ini harus lebih kompleks.
                // Di sini kita hanya mensimulasikan dengan placeholder atau URL statis.
                // Dalam aplikasi nyata, Anda akan upload gambar ke cloud storage dulu,
                // lalu dapatkan URL-nya untuk disimpan.
                image_url: formData.get('image_url') || 'https://via.placeholder.com/400x300/CCCCCC/FFFFFF?text=Gambar+Produk'
            };

            try {
                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData),
                });

                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.error || 'Gagal menambahkan produk');
                }

                alert('Produk berhasil ditambahkan!');
                window.location.href = 'index.html'; // Redirect ke halaman utama

            } catch (error) {
                console.error('Error saat menambah produk:', error);
                alert(`Terjadi kesalahan: ${error.message}`);
                submitButton.disabled = false;
                submitButton.textContent = 'Jual Sekarang';
            }
        });
    }
});