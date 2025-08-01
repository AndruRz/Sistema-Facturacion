//Funcionalidad de no retroceder
document.addEventListener('DOMContentLoaded', () => {
    // Evitar retroceso manipulando el historial del navegador
    (function() {
        // Agregar dos entradas al historial para dificultar el retroceso
        history.pushState({ page: 'facturacion' }, null, '/Facturacion');
        history.pushState({ page: 'facturacion' }, null, '/Facturacion');

        // Escuchar intentos de retroceso
        window.addEventListener('popstate', function(event) {
            // Si se intenta retroceder, empujar de nuevo la misma página
            history.pushState({ page: 'facturacion' }, null, '/Facturacion');
            // Forzar redirección a /Facturacion
            window.location.replace('/Facturacion');
        });

        // Evitar que el usuario use atajos de teclado para retroceder (opcional)
        window.addEventListener('keydown', function(event) {
            // Bloquear Alt + Flecha Izquierda (atajo común para retroceder)
            if (event.altKey && event.key === 'ArrowLeft') {
                event.preventDefault();
            }
        });
    })();
});

// Funcionalidad de Navbar
document.addEventListener('DOMContentLoaded', () => {
    // === Navbar Responsive Code ===
    let sidebar = null;
    let mobileMenuBtn = null;
    let overlay = null;
    let navLinks = [];
    let isMenuOpen = false;

    function initializeNavbar() {
        sidebar = document.querySelector('.main-header') || document.querySelector('.sidebar') || document.querySelector('nav');
        mobileMenuBtn = document.querySelector('.mobile-menu-btn') || document.querySelector('.hamburger') || document.querySelector('[data-mobile-menu]');
        overlay = document.querySelector('.sidebar-overlay') || document.querySelector('.overlay');
        navLinks = document.querySelectorAll('.nav-menu a') || document.querySelectorAll('nav a');

        if (!overlay) {
            createOverlay();
        }

        setupMobileMenuButton();
        setupOverlayClose();
        setupWindowResize();
        setupNavLinks();
        addIconsToNavLinks();
        setInitialActiveLink();
        initializeAnimations();
    }

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 998;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);
    }

    function setupMobileMenuButton() {
        if (!mobileMenuBtn) {
            console.error('Botón de menú móvil no encontrado');
            return;
        }

        mobileMenuBtn.replaceWith(mobileMenuBtn.cloneNode(true));
        mobileMenuBtn = document.querySelector('.mobile-menu-btn') || document.querySelector('.hamburger') || document.querySelector('[data-mobile-menu]');

        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });

        mobileMenuBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });
    }

    function toggleMobileMenu() {
        if (!sidebar || !overlay) {
            console.error('Elementos necesarios no encontrados');
            return;
        }

        const currentlyOpen = sidebar.classList.contains('mobile-open') || overlay.classList.contains('active');

        if (currentlyOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    function openMobileMenu() {
        overlay.style.display = 'block';
        overlay.classList.add('active');
        sidebar.classList.add('mobile-open');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('menu-open');
        isMenuOpen = true;
    }

    function closeMobileMenu() {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (!overlay.classList.contains('active')) {
                overlay.style.display = 'none';
            }
        }, 300);
        sidebar.classList.remove('mobile-open');
        document.body.style.overflow = '';
        document.body.classList.remove('menu-open');
        isMenuOpen = false;
    }

    function setupOverlayClose() {
        if (!overlay) return;
        overlay.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMobileMenu();
        });
        overlay.addEventListener('touchend', function(e) {
            e.stopPropagation();
            closeMobileMenu();
        });
    }

    function setupWindowResize() {
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768) {
                    closeMobileMenu();
                }
            }, 250);
        });
    }

    function setupNavLinks() {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                if (window.innerWidth <= 768) {
                    setTimeout(closeMobileMenu, 200);
                }
            });
        });
    }

    function addIconsToNavLinks() {
        const linkIcons = {
            'dashboard': '🏠',
            'productos': '📦',
            'inventario': '📊',
            'facturas': '🧾',
            'gestion': '🛠️',
            'ayuda': '💬',
            'salir': '⏻',
        };
        navLinks.forEach(link => {
            const href = link.getAttribute('href')?.substring(1);
            if (linkIcons[href] && !link.querySelector('.icon')) {
                const originalText = link.textContent.trim();
                link.innerHTML = `
                    <span class="icon">${linkIcons[href]}</span>
                    <span>${originalText}</span>
                `;
            }
        });
    }

    function setInitialActiveLink() {
        const dashboardLink = document.querySelector('a[href="#dashboard"]');
        if (dashboardLink) {
            dashboardLink.classList.add('active');
        }
    }

    function initializeAnimations() {
        const elements = document.querySelectorAll('.dashboard-card, .welcome-section');
        elements.forEach((element, index) => {
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    element.style.transition = 'all 0.5s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }

    setTimeout(() => {
        initializeNavbar();
    }, 100);
});

//Funcionalidad de Productos, Inventario, Facturacion, etc....
document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.querySelector('.main-dashboard');
  const navLinks = document.querySelectorAll('.nav-menu a');

  // =================================
  // Shared Utilities
  // =================================
  const productsPerPage = 8;

  async function populateDropdowns(categoryChoices, providerChoices, categorySelect = null, providerSelect = null) {
    try {
      const [categoriesRes, providersRes] = await Promise.all([
        fetch('/api/categorias'),
        fetch('/api/proveedores')
      ]);
      const categories = await categoriesRes.json();
      const providers = await providersRes.json();

      if (categoryChoices) {
        categoryChoices.clearStore();
        categoryChoices.setChoices([
          { value: '', label: 'Seleccionar una categoría', selected: true }
        ], 'value', 'label', true);
        categoryChoices.setChoices(
          categories.map(category => ({ value: category.id.toString(), label: category.nombre })),
          'value',
          'label',
          false
        );
      }

      if (providerChoices) {
        providerChoices.clearStore();
        providerChoices.setChoices([
          { value: '', label: 'Seleccionar un proveedor', selected: true }
        ], 'value', 'label', true);
        providerChoices.setChoices(
          providers.map(provider => ({ value: provider.id.toString(), label: provider.nombre })),
          'value',
          'label',
          false
        );
      }

      if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Seleccionar una categoría</option>';
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id.toString();
          option.textContent = category.nombre;
          categorySelect.appendChild(option);
        });
      }

      if (providerSelect) {
        providerSelect.innerHTML = '<option value="">Seleccionar un proveedor</option>';
        providers.forEach(provider => {
          const option = document.createElement('option');
          option.value = provider.id.toString();
          option.textContent = provider.nombre;
          providerSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }

  function renderPagination(totalProducts, currentPage, onPageChange, container) {
    container.innerHTML = '';
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if (totalPages <= 1) return;

    const pagination = document.createElement('div');
    pagination.classList.add('pagination');

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    });
    pagination.appendChild(prevButton);

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      const firstButton = document.createElement('button');
      firstButton.textContent = '1';
      firstButton.addEventListener('click', () => onPageChange(1));
      pagination.appendChild(firstButton);
      
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.padding = '10px';
        pagination.appendChild(ellipsis);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      pageButton.classList.toggle('active', i === currentPage);
      pageButton.addEventListener('click', () => onPageChange(i));
      pagination.appendChild(pageButton);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.padding = '10px';
        pagination.appendChild(ellipsis);
      }
      
      const lastButton = document.createElement('button');
      lastButton.textContent = totalPages;
      lastButton.addEventListener('click', () => onPageChange(totalPages));
      pagination.appendChild(lastButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Siguiente';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    });
    pagination.appendChild(nextButton);

    container.appendChild(pagination);
  }

  function showConfirmModal(message) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.classList.add('confirm-modal');
      modal.innerHTML = `
        <div class="confirm-modal-content">
          <p class="confirm-message">${message}</p>
          <div class="confirm-buttons">
            <button class="btn-confirm">Confirmar</button>
            <button class="btn-cancel-confirm">Cancelar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      setTimeout(() => {
        modal.classList.add('show');
      }, 10);

      const confirmButton = modal.querySelector('.btn-confirm');
      const cancelButton = modal.querySelector('.btn-cancel-confirm');

      confirmButton.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
          modal.remove();
          resolve(true);
        }, 300);
      });

      cancelButton.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
          modal.remove();
          resolve(false);
        }, 300);
      });
    });
  }

  function setupFormChangeTracking(form, initialData = null) {
    let hasUnsavedChanges = false;

    const getFormValues = () => {
      const formData = new FormData(form);
      const values = {};
      formData.forEach((value, key) => {
        values[key] = value;
      });
      form.querySelectorAll('select').forEach(select => {
        values[select.name] = select.value;
      });
      return values;
    };

    const hasChanges = () => {
      if (!initialData) {
        const values = getFormValues();
        return Object.values(values).some(value => value !== '' && value !== null);
      } else {
        const currentValues = getFormValues();
        return Object.keys(initialData).some(key => {
          const initial = initialData[key] ? initialData[key].toString() : '';
          const current = currentValues[key] ? currentValues[key].toString() : '';
          return initial !== current;
        });
      }
    };

    form.querySelectorAll('input, select, textarea').forEach(element => {
      element.addEventListener('input', () => {
        hasUnsavedChanges = hasChanges();
      });
      element.addEventListener('change', () => {
        hasUnsavedChanges = hasChanges();
      });
    });

    const beforeUnloadHandler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres salir? Los cambios no se guardarán.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    return {
      hasChanges: () => hasUnsavedChanges,
      cleanup: () => {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
      }
    };
  }

// =================================
// Sección de Productos (Agregar, Editar, Activar, Desactivar)
// =================================
const productsState = {
  currentActivePage: 1,
  currentInactivePage: 1,
  currentFilteredPage: 1,
  currentProducts: [],
  currentFilters: {},
  categoryChoices: null,
  providerChoices: null,
  inactiveProductsExpanded: false // Nuevo estado para recordar si están expandidos
};

function formatPrice(price) {
  const numPrice = typeof price === 'string' ? 
    parseFloat(price.replace('$', '').replace(',', '')) : 
    parseFloat(price);
  return `$${numPrice.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} COP`;
}

async function generateProductCode(categoryId) {
  try {
    const response = await fetch(`/api/categorias/${categoryId}`);
    const category = await response.json();
    const prefix = category.nombre.substring(0, 4).toUpperCase();
    
    while (true) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const code = `${prefix}-${randomNum}`;
      
      const checkResponse = await fetch(`/api/productos/check-code?code=${code}`);
      const isUnique = await checkResponse.json();
      
      if (isUnique) return code;
    }
  } catch (error) {
    console.error('Error generating product code:', error);
    return '';
  }
}

async function loadProductsSection() {
  window.scrollTo(0, 0);
  mainContent.innerHTML = '';

  const productsSection = document.createElement('div');
  productsSection.classList.add('products-section');
  productsSection.innerHTML = `
    <div class="welcome-section">
      <h1>Gestión de Productos</h1>
      <p>Administra tu catálogo de productos de forma eficiente</p>
    </div>
  `;

  productsSection.classList.add('products-section');

  const filterForm = document.createElement('form');
  filterForm.classList.add('product-filter-form');
  filterForm.innerHTML = `
    <div class="filter-group">
      <label for="search">Buscar por nombre o código:</label>
      <input type="text" id="search" name="search" placeholder="Nombre o código">
    </div>
    <div class="filter-group">
      <label for="category">Categoría:</label>
      <select id="category" name="category">
        <option value="">Seleccionar una categoría</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="provider">Proveedor:</label>
      <select id="provider" name="provider">
        <option value="">Seleccionar un proveedor</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="state">Estado:</label>
      <select id="state" name="state">
        <option value="">Todos los productos</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>
    </div>
    <button type="submit" class="btn-filter">Filtrar</button>
    <button type="button" class="btn-clear">Limpiar</button>
  `;
  productsSection.appendChild(filterForm);

  const newProductSection = document.createElement('div');
  newProductSection.classList.add('new-product-section');
  newProductSection.innerHTML = `
    <p>¿Deseas agregar un producto nuevo?</p>
    <button class="btn-new-product">Agregar Nuevo</button>
  `;
  productsSection.appendChild(newProductSection);

  const productsContainer = document.createElement('div');
  productsContainer.classList.add('products-container');
  productsSection.appendChild(productsContainer);

  mainContent.appendChild(productsSection);

  productsState.categoryChoices = new Choices('#category', {
    searchEnabled: true,
    placeholderValue: 'Seleccionar una categoría',
    searchPlaceholderValue: 'Buscar categoría',
    noResultsText: 'No se encontraron resultados',
    itemSelectText: '',
    shouldSort: false,
  });

  productsState.providerChoices = new Choices('#provider', {
    searchEnabled: true,
    placeholderValue: 'Seleccionar un proveedor',
    searchPlaceholderValue: 'Buscar proveedor',
    noResultsText: 'No se encontraron resultados',
    itemSelectText: '',
    shouldSort: false,
  });

  await populateDropdowns(productsState.categoryChoices, productsState.providerChoices);

  productsState.currentActivePage = 1;
  productsState.currentInactivePage = 1;
  productsState.currentFilteredPage = 1;
  productsState.currentFilters = {};

  await fetchProducts();

  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(filterForm);
    productsState.currentFilters = {
      search: formData.get('search') || '',
      category: formData.get('category') || '',
      provider: formData.get('provider') || '',
      state: formData.get('state') || ''
    };
    productsState.currentActivePage = 1;
    productsState.currentInactivePage = 1;
    productsState.currentFilteredPage = 1;
    await fetchProducts();
  });

  filterForm.querySelector('.btn-clear').addEventListener('click', async () => {
    filterForm.reset();
    productsState.categoryChoices.setChoiceByValue('');
    productsState.providerChoices.setChoiceByValue('');
    productsState.currentFilters = {};
    productsState.currentActivePage = 1;
    productsState.currentInactivePage = 1;
    productsState.currentFilteredPage = 1;
    await fetchProducts();
  });

  newProductSection.querySelector('.btn-new-product').addEventListener('click', () => {
    showNewProductModal();
  });
}

async function fetchProducts() {
  try {
    const query = new URLSearchParams(productsState.currentFilters).toString();
    const response = await fetch(`/api/productos?${query}`);
    const products = await response.json();
    
    if (products.some(product => !product.created_at)) {
      console.warn('Some products are missing the created_at field. Sorting may be inconsistent.');
    }
    
    productsState.currentProducts = products;
    renderProductsWithPagination();
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

function renderProductsWithPagination() {
  const container = document.querySelector('.products-container');
  if (!container) {
    console.error('Products container not found');
    return;
  }
  container.innerHTML = '';

  const sortedProducts = [...productsState.currentProducts].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });

  const hasFilters = Object.values(productsState.currentFilters).some(value => value !== '');

  if (hasFilters) {
    const totalProducts = sortedProducts.length;
    const startIndex = (productsState.currentFilteredPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

    const filteredSection = document.createElement('div');
    filteredSection.classList.add('products-list', 'filtered-products');
    filteredSection.innerHTML = `<h2>Productos Filtrados (${totalProducts})</h2>`;
    
    renderProductCards(paginatedProducts, filteredSection);
    
    const filteredPaginationContainer = document.createElement('div');
    filteredPaginationContainer.classList.add('pagination-container');
    renderPagination(totalProducts, productsState.currentFilteredPage, (newPage) => {
      productsState.currentFilteredPage = newPage;
      renderProductsWithPagination();
    }, filteredPaginationContainer);
    
    filteredSection.appendChild(filteredPaginationContainer);
    container.appendChild(filteredSection);
  } else {
    const activeProducts = sortedProducts.filter(p => p.estado === 'activo');
    const inactiveProducts = sortedProducts.filter(p => p.estado === 'inactivo');
    
    const activeSection = document.createElement('div');
    activeSection.classList.add('products-list', 'active-products');
    activeSection.innerHTML = `<h2>Productos Activos (${activeProducts.length})</h2>`;
    
    const totalActiveProducts = activeProducts.length;
    const activeStartIndex = (productsState.currentActivePage - 1) * productsPerPage;
    const activeEndIndex = activeStartIndex + productsPerPage;
    const paginatedActiveProducts = activeProducts.slice(activeStartIndex, activeEndIndex);
    
    renderProductCards(paginatedActiveProducts, activeSection);
    
    const activePaginationContainer = document.createElement('div');
    activePaginationContainer.classList.add('pagination-container');
    renderPagination(totalActiveProducts, productsState.currentActivePage, (newPage) => {
      productsState.currentActivePage = newPage;
      renderProductsWithPagination();
    }, activePaginationContainer);
    
    activeSection.appendChild(activePaginationContainer);
    container.appendChild(activeSection);

    const inactiveSection = document.createElement('div');
    inactiveSection.classList.add('products-list', 'inactive-products');
    
    const inactiveHeader = document.createElement('div');
    inactiveHeader.classList.add('inactive-header');
    inactiveHeader.innerHTML = `
      <h2 style="cursor: pointer; user-select: none;">
        Productos Inactivos (${inactiveProducts.length}) 
        <span class="toggle-icon">${productsState.inactiveProductsExpanded ? '▲' : '▼'}</span>
      </h2>
    `;
    
    const inactiveContent = document.createElement('div');
    inactiveContent.classList.add('inactive-content');
    // Mantener el estado expandido/colapsado
    inactiveContent.style.display = productsState.inactiveProductsExpanded ? 'block' : 'none';
    
    const totalInactiveProducts = inactiveProducts.length;
    const inactiveStartIndex = (productsState.currentInactivePage - 1) * productsPerPage;
    const inactiveEndIndex = inactiveStartIndex + productsPerPage;
    const paginatedInactiveProducts = inactiveProducts.slice(inactiveStartIndex, inactiveEndIndex);
    
    renderProductCards(paginatedInactiveProducts, inactiveContent);
    
    const inactivePaginationContainer = document.createElement('div');
    inactivePaginationContainer.classList.add('pagination-container');
    renderPagination(totalInactiveProducts, productsState.currentInactivePage, (newPage) => {
      productsState.currentInactivePage = newPage;
      // NO hacer scroll automático cuando se cambia de página en productos inactivos
      renderProductsWithPagination();
    }, inactivePaginationContainer);
    
    inactiveContent.appendChild(inactivePaginationContainer);
    
    inactiveHeader.addEventListener('click', () => {
      const isVisible = inactiveContent.style.display !== 'none';
      inactiveContent.style.display = isVisible ? 'none' : 'block';
      inactiveHeader.querySelector('.toggle-icon').textContent = isVisible ? '▼' : '▲';
      // Actualizar el estado global
      productsState.inactiveProductsExpanded = !isVisible;
    });
    
    inactiveSection.appendChild(inactiveHeader);
    inactiveSection.appendChild(inactiveContent);
    container.appendChild(inactiveSection);
  }
}

function renderProductCards(products, container) {
  if (products.length === 0) {
    const noProducts = document.createElement('p');
    noProducts.textContent = 'No hay productos en esta categoría.';
    noProducts.classList.add('no-products');
    container.appendChild(noProducts);
    return;
  }

  const productList = document.createElement('div');
  productList.classList.add('product-grid');

  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.classList.add('product-card');
    productCard.setAttribute('data-product-id', product.id);
    
    let buttonsHTML = '';
    if (product.estado === 'activo') {
      buttonsHTML = `
        <button class="btn-edit">Editar</button>
        <button class="btn-deactivate">Desactivar</button>
      `;
    } else {
      buttonsHTML = `
        <button class="btn-activate">Activar</button>
      `;
    }
    
    productCard.innerHTML = `
      <h3>${product.nombre}</h3>
      <p><strong>Código:</strong> ${product.codigo}</p>
      <p><strong>Categoría:</strong> ${product.categoria_nombre || 'N/A'}</p>
      <p><strong>Proveedor:</strong> ${product.proveedor_nombre || 'N/A'}</p>
      <p><strong>Precio:</strong> ${formatPrice(product.precio)}</p>
      <p><strong>Cantidad:</strong> ${product.cantidad}</p>
      <p class="product-status" data-estado="${product.estado}"><strong>Estado:</strong> ${product.estado}</p>
      <div class="product-buttons">
        ${buttonsHTML}
      </div>
    `;
    productList.appendChild(productCard);

    if (product.estado === 'activo') {
      const editBtn = productCard.querySelector('.btn-edit');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          showEditProductModal(product);
        });
      }

      const deactivateBtn = productCard.querySelector('.btn-deactivate');
      if (deactivateBtn) {
        deactivateBtn.addEventListener('click', async () => {
          await toggleProductState(product);
        });
      }
    } else {
      const activateBtn = productCard.querySelector('.btn-activate');
      if (activateBtn) {
        activateBtn.addEventListener('click', async () => {
          await toggleProductState(product);
        });
      }
    }
  });

  container.appendChild(productList);
}

async function toggleProductState(product) {
  const action = product.estado === 'activo' ? 'desactivar' : 'activar';
  const confirmMessage = `¿Estás seguro de que deseas ${action} este producto?`;
  const confirmed = await showConfirmModal(confirmMessage);
  if (!confirmed) {
    return;
  }

  const endpoint = product.estado === 'activo' 
    ? `/api/productos/${product.id}/desactivar` 
    : `/api/productos/${product.id}/activar`;
  
  try {
    const response = await fetch(endpoint, { method: 'PATCH' });
    if (response.ok) {
      await fetchProducts();
    } else {
      console.error(`Error ${action}ing product state`);
      alert(`Error al ${action} producto`);
    }
  } catch (error) {
    console.error(`Error ${action}ing product state:`, error);
    alert(`Error al ${action} producto`);
  }
}

function showNewCategoryModal(categorySelect, afterCreate) {
  const modal = document.createElement('div');
  modal.classList.add('modal', 'modal-small');
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Nueva Categoría</h2>
      <form class="new-category-form">
        <label>Nombre: <input type="text" name="nombre" required></label>
        <button type="submit" class="btn-save">Guardar</button>
        <button type="button" class="btn-cancel">Cancelar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.new-category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = e.target.querySelector('input[name="nombre"]').value.trim();
    
    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      });
      
      if (response.ok) {
        const newCategory = await response.json();
        
        if (categorySelect) {
          await populateDropdowns(null, null, categorySelect, null);
          categorySelect.value = newCategory.id.toString();
        }
        
        await populateDropdowns(productsState.categoryChoices, productsState.providerChoices);
        
        if (afterCreate) afterCreate(newCategory.id);
        modal.remove();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear categoría');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error al crear categoría');
    }
  });

  modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
}

function showNewProviderModal(providerSelect) {
  const modal = document.createElement('div');
  modal.classList.add('modal', 'modal-small');
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Nuevo Proveedor</h2>
      <form class="new-provider-form">
        <label>Nombre: <input type="text" name="nombre" required></label>
        <label>Contacto: <input type="text" name="contacto"></label>
        <button type="submit" class="btn-save">Guardar</button>
        <button type="button" class="btn-cancel">Cancelar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.new-provider-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = e.target.querySelector('input[name="nombre"]').value.trim();
    const contacto = e.target.querySelector('input[name="contacto"]').value.trim() || null;

    try {
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contacto })
      });

      if (response.ok) {
        const newProvider = await response.json();
        
        if (providerSelect) {
          await populateDropdowns(null, null, null, providerSelect);
          providerSelect.value = newProvider.id.toString();
        }
        
        await populateDropdowns(productsState.categoryChoices, productsState.providerChoices);
        
        modal.remove();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear proveedor');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      alert('Error al crear proveedor');
    }
  });

  modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
}

function showEditProductModal(product) {
  if (product.estado !== 'activo') {
    alert('Solo se pueden editar productos activos.');
    return;
  }

  const modal = document.createElement('div');
  modal.classList.add('modal');
  document.body.style.overflow = 'hidden';

  let providerFieldHTML = `
    <div class="form-group">
      <label>Proveedor: 
        <select name="proveedor_id">
          <option value="">Seleccionar un proveedor</option>
        </select>
        <button type="button" class="btn-add-new btn-add-provider">Nuevo Proveedor</button>
      </label>
    </div>
  `;

  modal.innerHTML = `
    <div class="modal-content">
      <h2>Editar Producto</h2>
      <form class="edit-product-form">
        <label>
          Código: 
          <div class="input-container">
            <input type="text" name="codigo" value="${product.codigo}" readonly class="readonly-field">
            <span class="lock-icon">🔒</span>
          </div>
        </label>
        <label>Nombre: <input type="text" name="nombre" value="${product.nombre}" required></label>
        <label>
          Categoría: 
          <div class="input-container">
            <input type="text" name="categoria_nombre" value="${product.categoria_nombre || 'N/A'}" readonly class="readonly-field">
            <span class="lock-icon">🔒</span>
          </div>
        </label>
        ${providerFieldHTML}
        <label>Precio: <input type="text" name="precio" value="${Math.round(product.precio).toLocaleString('es-CO', { minimumFractionDigits: 0 })}" required></label>
        <button type="submit" class="btn-save">Guardar</button>
        <button type="button" class="btn-cancel">Cancelar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const providerSelect = modal.querySelector('select[name="proveedor_id"]');
  const priceInput = modal.querySelector('input[name="precio"]');
  const form = modal.querySelector('.edit-product-form');

  const initialData = {
    nombre: product.nombre,
    proveedor_id: product.proveedor_id ? product.proveedor_id.toString() : '',
    precio: Math.round(product.precio).toString()
  };

  const { hasChanges, cleanup } = setupFormChangeTracking(form, initialData);

  populateDropdowns(null, null, null, providerSelect).then(() => {
    if (product.proveedor_id) {
      const providerIdStr = product.proveedor_id.toString();
      providerSelect.value = providerIdStr;
    } else {
      providerSelect.value = "";
    }
  }).catch(error => {
    console.error('Error populating provider dropdown:', error);
    if (product.proveedor_id && product.proveedor_nombre) {
      const option = document.createElement('option');
      option.value = product.proveedor_id.toString();
      option.textContent = product.proveedor_nombre;
      option.selected = true;
      providerSelect.appendChild(option);
    }
  });

  priceInput.addEventListener('focus', () => {
    priceInput.value = priceInput.value.replace(/[^0-9]/g, '');
  });
  priceInput.addEventListener('blur', () => {
    const value = priceInput.value.replace(/[^0-9]/g, '');
    if (value) {
      priceInput.value = parseInt(value).toLocaleString('es-CO', { minimumFractionDigits: 0 });
    }
  });

  modal.querySelector('.btn-add-provider').addEventListener('click', () => {
    showNewProviderModal(providerSelect);
  });

  modal.querySelector('.edit-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      nombre: formData.get('nombre'),
      precio: parseInt(formData.get('precio').replace(/\./g, '')),
      proveedor_id: formData.get('proveedor_id') ? parseInt(formData.get('proveedor_id')) : null
    };

    if (isNaN(productData.precio) || productData.precio <= 0) {
      alert('El precio debe ser un número válido mayor a 0');
      return;
    }

    try {
      const response = await fetch(`/api/productos/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        cleanup();
        await fetchProducts();
        await populateDropdowns(productsState.categoryChoices, productsState.providerChoices);
        modal.remove();
        document.body.style.overflow = '';
      } else {
        const error = await response.json();
        alert(error.message || 'Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar producto');
    }
  });

  modal.querySelector('.btn-cancel').addEventListener('click', async () => {
    if (hasChanges()) {
      const confirmed = await showConfirmModal('¿Estás seguro de que quieres salir? Los cambios no se guardarán.');
      if (!confirmed) {
        return;
      }
    }
    cleanup();
    modal.remove();
    document.body.style.overflow = '';
  });
}

function showNewProductModal() {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  document.body.style.overflow = 'hidden';
  
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Agregar Nuevo Producto</h2>
      <form class="new-product-form">
        <label>Código: <input type="text" name="codigo" readonly></label>
        <label>Nombre: <input type="text" name="nombre" required></label>
        <div class="form-group">
          <label>Categoría: 
            <select name="categoria_id" required></select>
            <button type="button" class="btn-add-new btn-add-category">Nueva Categoría</button>
          </label>
        </div>
        <div class="form-group">
          <label>Proveedor: 
            <select name="proveedor_id"></select>
            <button type="button" class="btn-add-new btn-add-provider">Nuevo Proveedor</button>
          </label>
        </div>
        <label>Precio: <input type="text" name="precio" required></label>
        <label>Cantidad: <input type="number" name="cantidad" min="1" required></label>
        <label>Fecha: <input type="date" name="fecha" required></label>
        <button type="submit" class="btn-save">Guardar</button>
        <button type="button" class="btn-cancel">Cancelar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const categorySelect = modal.querySelector('select[name="categoria_id"]');
  const providerSelect = modal.querySelector('select[name="proveedor_id"]');
  const codeInput = modal.querySelector('input[name="codigo"]');
  const priceInput = modal.querySelector('input[name="precio"]');
  const form = modal.querySelector('.new-product-form');

  const { hasChanges, cleanup } = setupFormChangeTracking(form);

  populateDropdowns(null, null, categorySelect, providerSelect);

  categorySelect.addEventListener('change', async () => {
    if (categorySelect.value) {
      const code = await generateProductCode(categorySelect.value);
      codeInput.value = code;
    } else {
      codeInput.value = '';
    }
  });

  priceInput.addEventListener('blur', () => {
    const value = priceInput.value.replace(/[^0-9]/g, '');
    if (value) {
      priceInput.value = parseInt(value).toLocaleString('es-CO');
    }
  });

  modal.querySelector('.btn-add-category').addEventListener('click', () => {
    showNewCategoryModal(categorySelect, async (newCategoryId) => {
      const code = await generateProductCode(newCategoryId);
      codeInput.value = code;
    });
  });

  modal.querySelector('.btn-add-provider').addEventListener('click', () => {
    showNewProviderModal(providerSelect);
  });

  modal.querySelector('.new-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      codigo: formData.get('codigo'),
      nombre: formData.get('nombre'),
      categoria_id: parseInt(formData.get('categoria_id')),
      precio: parseFloat(formData.get('precio').replace(/\./g, '')),
      cantidad: parseInt(formData.get('cantidad')),
      proveedor_id: formData.get('proveedor_id') ? parseInt(formData.get('proveedor_id')) : null,
      fecha: formData.get('fecha')
    };

    if (productData.cantidad < 1) {
      alert('La cantidad debe ser al menos 1');
      return;
    }

    try {
      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        cleanup();
        await fetchProducts();
        await populateDropdowns(productsState.categoryChoices, productsState.providerChoices);
        modal.remove();
        document.body.style.overflow = '';
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear producto');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al crear producto');
    }
  });

  modal.querySelector('.btn-cancel').addEventListener('click', async () => {
    if (hasChanges()) {
      const confirmed = await showConfirmModal('¿Estás seguro de que quieres salir? Los cambios no se guardarán.');
      if (!confirmed) {
        return;
      }
    }
    cleanup();
    modal.remove();
    document.body.style.overflow = '';
  });
}

  // =================================
  // Sección de Inventariado (Agregar Unidades Nuevas, Descontar Unidades)
  // =================================

  const inventoryState = {
    currentPage: 1,
    currentProducts: [],
    currentFilters: {}
  };

  async function loadInventorySection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = '';

    const inventorySection = document.createElement('div');
    inventorySection.classList.add('inventory-section');
    inventorySection.innerHTML = `
      <div class="welcome-section">
        <h1>Control de Inventario</h1>
        <p>Mantén tu stock actualizado y bajo control</p>
      </div>
    `;

    const filterForm = document.createElement('form');
    filterForm.classList.add('inventory-filter-form');
    filterForm.innerHTML = `
      <div class="filter-group">
        <label for="search">Buscar por nombre o código:</label>
        <input type="text" id="search" name="search" placeholder="Nombre o código">
      </div>
      <div class="filter-group">
        <label for="category">Categoría:</label>
        <select id="category" name="category">
          <option value="">Seleccionar una categoría</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="provider">Proveedor:</label>
        <select id="provider" name="provider">
          <option value="">Seleccionar un proveedor</option>
        </select>
      </div>
      <button type="submit" class="btn-filter">Filtrar</button>
      <button type="button" class="btn-clear">Limpiar</button>
    `;
    inventorySection.appendChild(filterForm);

    const inventoryContainer = document.createElement('div');
    inventoryContainer.classList.add('inventory-container');
    inventorySection.appendChild(inventoryContainer);

    mainContent.appendChild(inventorySection);

    const categoryChoices = new Choices('#category', {
      searchEnabled: true,
      placeholderValue: 'Seleccionar una categoría',
      searchPlaceholderValue: 'Buscar categoría',
      noResultsText: 'No se encontraron resultados',
      itemSelectText: '',
      shouldSort: false,
    });

    const providerChoices = new Choices('#provider', {
      searchEnabled: true,
      placeholderValue: 'Seleccionar un proveedor',
      searchPlaceholderValue: 'Buscar proveedor',
      noResultsText: 'No se encontraron resultados',
      itemSelectText: '',
      shouldSort: false,
    });

    await populateDropdowns(categoryChoices, providerChoices);

    inventoryState.currentPage = 1;
    inventoryState.currentFilters = {};
    await fetchInventory();

    filterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(filterForm);
      inventoryState.currentFilters = {
        search: formData.get('search') || '',
        category: formData.get('category') || '',
        provider: formData.get('provider') || '',
      };
      inventoryState.currentPage = 1;
      await fetchInventory();
    });

    filterForm.querySelector('.btn-clear').addEventListener('click', async () => {
      filterForm.reset();
      categoryChoices.setChoiceByValue('');
      providerChoices.setChoiceByValue('');
      inventoryState.currentFilters = {};
      inventoryState.currentPage = 1;
      await fetchInventory();
    });
  }

  async function fetchInventory() {
    try {
      const query = new URLSearchParams(inventoryState.currentFilters).toString();
      const response = await fetch(`/api/inventario?${query}`);
      const products = await response.json();
      
      if (products.some(product => !product.created_at)) {
        console.warn('Some products are missing the created_at field. Sorting may be inconsistent.');
      }
      
      inventoryState.currentProducts = products;
      renderInventoryWithPagination();
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  }

  function renderInventoryWithPagination() {
    const container = document.querySelector('.inventory-container');
    if (!container) {
      console.error('Inventory container not found');
      return;
    }
    container.innerHTML = '';

    const sortedProducts = [...inventoryState.currentProducts].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });

    const totalProducts = sortedProducts.length;
    const startIndex = (inventoryState.currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

    const inventorySection = document.createElement('div');
    inventorySection.classList.add('inventory-list');
    inventorySection.innerHTML = `<h2>Inventario Activo (${totalProducts})</h2>`;
    
    renderInventoryCards(paginatedProducts, inventorySection);
    
    const paginationContainer = document.createElement('div');
    paginationContainer.classList.add('pagination-container');
    renderPagination(totalProducts, inventoryState.currentPage, (newPage) => {
      inventoryState.currentPage = newPage;
      renderInventoryWithPagination();
    }, paginationContainer);
    
    inventorySection.appendChild(paginationContainer);
    container.appendChild(inventorySection);
  }

  function renderInventoryCards(products, container) {
    if (products.length === 0) {
      const noProducts = document.createElement('p');
      noProducts.textContent = 'No hay productos activos.';
      noProducts.classList.add('no-products');
      container.appendChild(noProducts);
      return;
    }

    const inventoryList = document.createElement('div');
    inventoryList.classList.add('inventory-grid');

    products.forEach(product => {
      const inventoryCard = document.createElement('div');
      inventoryCard.classList.add('inventory-card');
      inventoryCard.setAttribute('data-product-id', product.id);
      
      inventoryCard.innerHTML = `
        <h3>${product.nombre}</h3>
        <p><strong>Código:</strong> ${product.codigo}</p>
        <p><strong>Categoría:</strong> ${product.categoria_nombre || 'N/A'}</p>
        <p><strong>Proveedor:</strong> ${product.proveedor_nombre || 'N/A'}</p>
        <p><strong>Cantidad:</strong> ${product.cantidad}</p>
        <div class="inventory-buttons">
          <button class="btn-add-units">Insertar Unidades Nuevas</button>
          <button class="btn-discount-units">Descontar Unidades</button>
        </div>
      `;
      inventoryList.appendChild(inventoryCard);

      inventoryCard.querySelector('.btn-add-units').addEventListener('click', () => {
        showAddUnitsModal(product);
      });

      inventoryCard.querySelector('.btn-discount-units').addEventListener('click', () => {
        showDiscountUnitsModal(product);
      });
    });

    container.appendChild(inventoryList);
  }

  async function showAddUnitsModal(product) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    document.body.style.overflow = 'hidden';

    modal.innerHTML = `
      <div class="modal-content">
        <h2>Agregar Unidades - ${product.nombre}</h2>
        <form class="add-units-form">
          <label>Unidades Nuevas: <input type="number" name="unidades_nuevas" min="1" required></label>
          <label>Fecha: <input type="date" name="fecha" required></label>
          <label>Proveedor: 
            <select name="proveedor_id">
              <option value="">Seleccionar un proveedor</option>
            </select>
          </label>
          <button type="submit" class="btn-save">Guardar</button>
          <button type="button" class="btn-cancel">Cancelar</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const providerSelect = modal.querySelector('select[name="proveedor_id"]');
    await populateDropdowns(null, null, null, providerSelect);

    const form = modal.querySelector('.add-units-form');
    const { hasChanges, cleanup } = setupFormChangeTracking(form);

    modal.querySelector('.add-units-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inventoryData = {
        producto_id: product.id,
        unidades_nuevas: parseInt(formData.get('unidades_nuevas')),
        fecha: formData.get('fecha'),
        proveedor_id: formData.get('proveedor_id') || null,
      };

      if (inventoryData.unidades_nuevas < 1) {
        alert('Las unidades nuevas deben ser al menos 1');
        return;
      }

      try {
        const response = await fetch('/api/inventario/agregar-unidades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inventoryData)
        });

        if (response.ok) {
          cleanup();
          await fetchInventory();
          modal.remove();
          document.body.style.overflow = '';
        } else {
          const error = await response.json();
          alert(error.message || 'Error al agregar unidades');
        }
      } catch (error) {
        console.error('Error adding units:', error);
        alert('Error al agregar unidades');
      }
    });

    modal.querySelector('.btn-cancel').addEventListener('click', async () => {
      if (hasChanges()) {
        const confirmed = await showConfirmModal('¿Estás seguro de que quieres salir? Los cambios no se guardarán.');
        if (!confirmed) {
          return;
        }
      }
      cleanup();
      modal.remove();
      document.body.style.overflow = '';
    });
  }

  async function showDiscountUnitsModal(product) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    document.body.style.overflow = 'hidden';

    modal.innerHTML = `
      <div class="modal-content">
        <h2>Descontar Unidades - ${product.nombre}</h2>
        <form class="discount-units-form">
          <label>Unidades a Descontar: <input type="number" name="unidades_descontadas" min="1" max="${product.cantidad}" required></label>
          <label>Fecha: <input type="date" name="fecha" required></label>
          <label>Razón del Descuento: <textarea name="razon_descuento" required></textarea></label>
          <button type="submit" class="btn-save">Guardar</button>
          <button type="button" class="btn-cancel">Cancelar</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const form = modal.querySelector('.discount-units-form');
    const { hasChanges, cleanup } = setupFormChangeTracking(form);

    modal.querySelector('.discount-units-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inventoryData = {
        producto_id: product.id,
        unidades_descontadas: parseInt(formData.get('unidades_descontadas')),
        fecha: formData.get('fecha'),
        razon_descuento: formData.get('razon_descuento'),
      };

      if (inventoryData.unidades_descontadas < 1) {
        alert('Las unidades a descontar deben ser al menos 1');
        return;
      }

      if (inventoryData.unidades_descontadas > product.cantidad) {
        alert('No puedes descontar más unidades de las disponibles');
        return;
      }

      try {
        const response = await fetch('/api/inventario/descontar-unidades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inventoryData)
        });

        if (response.ok) {
          cleanup();
          await fetchInventory();
          modal.remove();
          document.body.style.overflow = '';
        } else {
          const error = await response.json();
          alert(error.message || 'Error al descontar unidades');
        }
      } catch (error) {
        console.error('Error discounting units:', error);
        alert('Error al descontar unidades');
      }
    });

    modal.querySelector('.btn-cancel').addEventListener('click', async () => {
      if (hasChanges()) {
        const confirmed = await showConfirmModal('¿Estás seguro de que quieres salir? Los cambios no se guardarán.');
        if (!confirmed) {
          return;
        }
      }
      cleanup();
      modal.remove();
      document.body.style.overflow = '';
    });
  }

// =================================
// Sección de Facturación (Crear, Buscar y Conocer Factura, Devolver Unidades, Cancelar Factura)
// =================================

async function loadBillingSection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = '';

    const billingSection = document.createElement('div');
    billingSection.classList.add('billing-section');
    billingSection.innerHTML = `
        <div class="welcome-section">
            <h1>Gestión de Facturas</h1>
            <p>Crea, consulta y administra tus facturas con facilidad</p>
        </div>
    `;

    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('billing-actions');
    actionsContainer.innerHTML = `
        <button class="btn-create-invoice">Crear Factura</button>
        <button class="btn-search-invoice">Buscar Factura</button>
        <button class="btn-return-units">Devolver Unidades</button>
        <button class="btn-cancel-invoice">Cancelar Factura</button>
    `;
    billingSection.appendChild(actionsContainer);

    const summaryContainer = document.createElement('div');
    summaryContainer.classList.add('billing-summary');
    summaryContainer.innerHTML = `
        <div class="summary-header">
            <h2>Resumen de Hoy</h2>
            <p class="summary-date">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="summary-card">
            <i class="fas fa-file-invoice summary-icon"></i>
            <h3>Facturas Hoy</h3>
            <p class="summary-value" id="facturas-hoy">Seleccione una factura</p>
            <p class="summary-label">Facturas generadas</p>
        </div>
        <div class="summary-card">
            <i class="fas fa-boxes summary-icon"></i>
            <h3>Productos Vendidos</h3>
            <p class="summary-value" id="productos-vendidos">Seleccione una factura</p>
            <p class="summary-label">Unidades vendidas hoy</p>
        </div>
        <div class="summary-card">
            <i class="fas fa-money-bill-wave summary-icon"></i>
            <h3>Ingresos Hoy</h3>
            <p class="summary-value" id="ingresos-hoy">Seleccione una factura</p>
            <p class="summary-label">Total recaudado</p>
        </div>
    `;
    billingSection.appendChild(summaryContainer);

    mainContent.appendChild(billingSection);

    await fetchSummaryData();

    actionsContainer.querySelector('.btn-create-invoice').addEventListener('click', () => {
        loadCreateInvoiceSection();
    });

    actionsContainer.querySelector('.btn-search-invoice').addEventListener('click', () => {
        loadSearchInvoiceSection();
    });

    actionsContainer.querySelector('.btn-return-units').addEventListener('click', () => {
        loadReturnUnitsSection();
    });

    actionsContainer.querySelector('.btn-cancel-invoice').addEventListener('click', () => {
        loadCancelInvoiceSection();
    });
}

async function fetchSummaryData() {
    try {
        const response = await fetch('/api/facturacion/resumen');
        const summary = await response.json();

        document.getElementById('facturas-hoy').textContent = summary.facturas_hoy || 0;
        document.getElementById('productos-vendidos').textContent = summary.productos_vendidos || 0;
        document.getElementById('ingresos-hoy').textContent = summary.ingresos_hoy
            ? new Intl.NumberFormat('es-CO', {
                  style: 'decimal',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
              }).format(summary.ingresos_hoy) + '$'
            : '0$';
    } catch (error) {
        console.error('Error fetching summary data:', error);
        document.getElementById('facturas-hoy').textContent = 'Error';
        document.getElementById('productos-vendidos').textContent = 'Error';
        document.getElementById('ingresos-hoy').textContent = 'Error';
    }
}

//Crear Factura
async function loadCreateInvoiceSection() {
  window.scrollTo(0, 0);
  mainContent.innerHTML = '';

  // Obtener fecha y hora actual
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;
  let lastInvoiceNumber = await fetchLastInvoiceNumber();

  // Establecer un vendorId predeterminado
  const vendorId = 1; // TODO: Ajusta este valor según cómo obtengas el ID del vendedor
  console.log('Usando vendorId:', vendorId);

  // Lista de productos seleccionados para la factura (incluye descuentos)
  let selectedProducts = [];
  // Lista de pagos realizados
  let payments = [];

  const createInvoiceSection = document.createElement('div');
  createInvoiceSection.classList.add('create-invoice-section');
  createInvoiceSection.innerHTML = `
    <div class="invoice-header">
      <h1>Crear Nueva Factura</h1>
      <div class="invoice-details">
        <label for="invoice-date">Fecha:</label>
        <input type="date" id="invoice-date" value="${currentDate}" max="${currentDate}">
        <span id="invoice-time">${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
        <span id="time-travel-message"></span>
        <label for="invoice-number">Número de Factura:</label>
        <input type="text" id="invoice-number" value="${lastInvoiceNumber.lastNUV}" readonly>
      </div>
    </div>
    <div class="invoice-actions">
      <button class="btn-add-product">Agregar Producto</button>
      <button class="btn-delete-product">Eliminar Producto</button>
      <button class="btn-add-discount">Agregar Descuento</button>
      <button class="btn-payment-method">Medio de Pago</button>
      <button class="btn-back-to-billing">Regresar al Menú de Facturas</button>
    </div>
    <div class="invoice-products">
      <h2>Productos</h2>
      <table class="products-table">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all-products"></th>
            <th>Código</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unitario</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody id="products-table-body">
          <tr>
            <td colspan="6" class="no-products">No hay productos</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="total-label">Total:</td>
            <td id="invoice-total">$0</td>
          </tr>
          <tr>
            <td colspan="5" class="total-label">Pagado:</td>
            <td id="invoice-paid">$0</td>
          </tr>
          <tr>
            <td colspan="5" class="total-label">Faltante:</td>
            <td id="invoice-remaining">$0</td>
          </tr>
        </tfoot>
      </table>
      <button class="btn-finalize-purchase" disabled>¡Finalizar Compra!</button>
    </div>
  `;

  mainContent.appendChild(createInvoiceSection);

  // Función para formatear precios (sin ",00")
  const formatPrice = (value, formatted = true) => {
    if (!formatted) return value.toString();
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('COP', '').trim();
  };

  // Función para calcular el total, pagado y faltante
  const calculateTotals = () => {
    let total = 0;
    selectedProducts.forEach(item => {
      if (item.isDiscount) {
        total -= item.amount; // Descuentos restan al total
      } else {
        total += item.quantity * item.price; // Productos suman al total
      }
    });

    let paid = 0;
    payments.forEach(payment => {
      paid += payment.amount;
    });

    const remaining = Math.max(total - paid, 0);

    return { total, paid, remaining };
  };

  // Función para actualizar la tabla de productos y estado del botón
  const updateProductTable = () => {
    const tbody = createInvoiceSection.querySelector('#products-table-body');
    const totalElement = createInvoiceSection.querySelector('#invoice-total');
    const paidElement = createInvoiceSection.querySelector('#invoice-paid');
    const remainingElement = createInvoiceSection.querySelector('#invoice-remaining');
    const selectAllCheckbox = createInvoiceSection.querySelector('#select-all-products');
    const finalizeButton = createInvoiceSection.querySelector('.btn-finalize-purchase');
    tbody.innerHTML = '';

    if (selectedProducts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-products">No hay productos</td></tr>';
      totalElement.textContent = '$0';
      paidElement.textContent = '$0';
      remainingElement.textContent = '$0';
      selectAllCheckbox.disabled = true;
      finalizeButton.disabled = true;
      return;
    }

    selectAllCheckbox.disabled = false;
    selectedProducts.forEach((item, index) => {
      const row = document.createElement('tr');
      if (item.isDiscount) {
        if (!('isFormatted' in item)) item.isFormatted = true;
        row.innerHTML = `
          <td><input type="checkbox" class="product-checkbox" data-index="${index}"></td>
          <td>-</td>
          <td>DESCUENTO</td>
          <td>1</td>
          <td><span class="discount-editable" data-index="${index}">${formatPrice(item.amount, item.isFormatted)}</span></td>
          <td>${formatPrice(item.amount, item.isFormatted)}</td>
        `;
      } else {
        const subtotal = item.quantity * item.price;
        row.innerHTML = `
          <td><input type="checkbox" class="product-checkbox" data-index="${index}"></td>
          <td>${item.codigo}</td>
          <td>${item.nombre}</td>
          <td><span class="quantity-editable" data-index="${index}">${item.quantity}</span></td>
          <td><span class="price-editable" data-index="${index}">${formatPrice(item.price)}</span></td>
          <td>${formatPrice(subtotal)}</td>
        `;
      }
      tbody.appendChild(row);
    });

    const { total, paid, remaining } = calculateTotals();
    totalElement.textContent = formatPrice(total);
    paidElement.textContent = formatPrice(paid);
    remainingElement.textContent = formatPrice(remaining);

    finalizeButton.disabled = selectedProducts.length === 0 || remaining > 0;

    const priceElements = tbody.querySelectorAll('.price-editable');
    priceElements.forEach(element => {
      element.removeEventListener('click', element.clickHandler);
      element.clickHandler = (e) => {
        const index = parseInt(e.target.dataset.index);
        if (!selectedProducts[index]) return;
        const input = document.createElement('input');
        input.type = 'number';
        input.value = selectedProducts[index].price;
        input.classList.add('price-input');
        input.addEventListener('blur', () => {
          const newPrice = parseFloat(input.value) || selectedProducts[index].originalPrice;
          selectedProducts[index].price = newPrice;
          updateProductTable();
        });
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') input.blur();
        });
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
      };
      element.addEventListener('click', element.clickHandler);
    });

    const quantityElements = tbody.querySelectorAll('.quantity-editable');
    quantityElements.forEach(element => {
      element.removeEventListener('click', element.clickHandler);
      element.clickHandler = (e) => {
        const index = parseInt(e.target.dataset.index);
        if (!selectedProducts[index]) return;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.value = selectedProducts[index].quantity;
        input.classList.add('quantity-input');
        input.addEventListener('blur', () => {
          const newQuantity = parseInt(input.value) || 1;
          selectedProducts[index].quantity = newQuantity;
          updateProductTable();
        });
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') input.blur();
        });
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
      };
      element.addEventListener('click', element.clickHandler);
    });

    const discountElements = tbody.querySelectorAll('.discount-editable');
    discountElements.forEach(element => {
      element.removeEventListener('click', element.clickHandler);
      element.clickHandler = (e) => {
        const index = parseInt(e.target.dataset.index);
        if (!selectedProducts[index]) return;
        selectedProducts[index].isFormatted = !selectedProducts[index].isFormatted;
        updateProductTable();
      };
      element.addEventListener('click', element.clickHandler);
    });

    selectAllCheckbox.removeEventListener('change', selectAllCheckbox.changeHandler);
    selectAllCheckbox.changeHandler = (e) => {
      const checkboxes = tbody.querySelectorAll('.product-checkbox');
      checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
    };
    selectAllCheckbox.addEventListener('change', selectAllCheckbox.changeHandler);
  };

  const openAddProductModal = async () => {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">×</span>
        <h2>Agregar Producto</h2>
        <div class="search-section">
          <label for="search-code">Buscar por Código:</label>
          <input type="text" id="search-code" placeholder="Ingrese el código">
          <label for="category-select">O buscar por Categoría:</label>
          <select id="category-select"><option value="">Todas las categorías</option></select>
        </div>
        <div class="products-list">
          <table><thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Acción</th></tr></thead><tbody id="modal-products-body"></tbody></table>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const categorySelect = modal.querySelector('#category-select');
    try {
      const response = await fetch('/api/categorias');
      const categories = await response.json();
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.nombre;
        categorySelect.appendChild(option);
      });
    } catch (error) { console.error('Error fetching categories:', error); }

    const loadProducts = async () => {
      const searchCode = modal.querySelector('#search-code').value;
      const categoryId = categorySelect.value;
      const tbody = modal.querySelector('#modal-products-body');
      tbody.innerHTML = '<tr><td colspan="4">Seleccione una factura</td></tr>';

      try {
        let url = '/api/productos?state=activo';
        if (searchCode) url += `&search=${encodeURIComponent(searchCode)}`;
        if (categoryId) url += `&category=${categoryId}`;
        const response = await fetch(url);
        const products = await response.json();
        tbody.innerHTML = '';
        if (products.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4">No se encontraron productos</td></tr>';
          return;
        }
        products.forEach(product => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${product.nombre}</td>
            <td>${product.categoria_nombre || 'Sin categoría'}</td>
            <td>${formatPrice(product.precio)}</td>
            <td><button class="select-product" data-id="${product.id}" data-codigo="${product.codigo}" data-nombre="${product.nombre}" data-precio="${product.precio}" data-cantidad="${product.cantidad}">Seleccionar</button></td>
          `;
          tbody.appendChild(row);
        });
        tbody.querySelectorAll('.select-product').forEach(button => {
          button.addEventListener('click', () => {
            const product = {
              id: button.dataset.id,
              codigo: button.dataset.codigo,
              nombre: button.dataset.nombre,
              originalPrice: parseFloat(button.dataset.precio),
              price: parseFloat(button.dataset.precio),
              stock: parseInt(button.dataset.cantidad)
            };
            openQuantityModal(product, closeModal);
          });
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        tbody.innerHTML = '<tr><td colspan="4">Error al cargar productos</td></tr>';
      }
    };

    const openQuantityModal = (product, closeParentModal) => {
      const quantityModal = document.createElement('div');
      quantityModal.classList.add('modal', 'quantity-modal');
      quantityModal.innerHTML = `
        <div class="modal-content quantity-modal-content">
          <span class="close">×</span>
          <h2>Detalles del Producto</h2>
          <div class="product-info">
            <p><strong>Producto:</strong> ${product.nombre}</p>
            <p><strong>Stock Disponible:</strong> ${product.stock}</p>
          </div>
          <div class="input-group">
            <label for="quantity">Cantidad:</label>
            <input type="number" id="quantity" min="1" max="${product.stock}" value="1">
          </div>
          <div class="input-group">
            <label for="price">Precio Unitario:</label>
            <div class="price-container">
              <span class="price-display">${formatPrice(product.price)}</span>
              <input type="number" id="price" value="${product.price}" step="0.01" style="display: none;">
            </div>
          </div>
          <div class="modal-actions">
            <button id="confirm-add">Agregar</button>
            <button id="cancel-add">Cancelar</button>
          </div>
        </div>
      `;
      document.body.appendChild(quantityModal);

      const closeQuantityModal = () => quantityModal.remove();
      quantityModal.querySelector('.close').addEventListener('click', closeQuantityModal);
      quantityModal.querySelector('#cancel-add').addEventListener('click', closeQuantityModal);
      quantityModal.addEventListener('click', (e) => { if (e.target === quantityModal) closeQuantityModal(); });

      const priceContainer = quantityModal.querySelector('.price-container');
      const priceDisplay = priceContainer.querySelector('.price-display');
      const priceInput = quantityModal.querySelector('#price');

      priceDisplay.addEventListener('click', () => {
        priceDisplay.style.display = 'none';
        priceInput.style.display = 'inline-block';
        priceInput.focus();
      });

      priceInput.addEventListener('blur', () => {
        const newPrice = parseFloat(priceInput.value) || product.price;
        priceInput.value = newPrice;
        priceDisplay.textContent = formatPrice(newPrice);
        priceDisplay.style.display = 'inline-block';
        priceInput.style.display = 'none';
      });

      priceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') priceInput.blur();
      });

      quantityModal.querySelector('#confirm-add').addEventListener('click', () => {
        const quantity = parseInt(quantityModal.querySelector('#quantity').value) || 1;
        const price = parseFloat(quantityModal.querySelector('#price').value) || product.price;
        if (quantity > product.stock) {
          alert('La cantidad solicitada excede el stock disponible.');
          return;
        }
        selectedProducts.push({
          id: product.id,
          codigo: product.codigo,
          nombre: product.nombre,
          quantity: quantity,
          originalPrice: product.originalPrice,
          price: price
        });
        updateProductTable();
        closeQuantityModal();
        closeParentModal();
      });
    };

    loadProducts();
    modal.querySelector('#search-code').addEventListener('input', loadProducts);
    categorySelect.addEventListener('change', loadProducts);
  };

  const openDiscountModal = () => {
    const { total } = calculateTotals();
    if (total <= 0) {
      alert('No hay monto a descontar. Agregue productos primero.');
      return;
    }

    const modal = document.createElement('div');
    modal.classList.add('modal', 'discount-modal');
    modal.innerHTML = `
      <div class="modal-content discount-modal-content">
        <span class="close">×</span>
        <h2>Agregar Descuento</h2>
        <div class="input-group">
          <label for="discount-amount">Monto del Descuento:</label>
          <input type="number" id="discount-amount" min="0" placeholder="Ingrese el monto">
        </div>
        <div class="modal-actions">
          <button id="confirm-discount">Agregar</button>
          <button id="cancel-discount">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.querySelector('#cancel-discount').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const discountInput = modal.querySelector('#discount-amount');
    discountInput.addEventListener('blur', () => {
      const amount = parseFloat(discountInput.value) || 0;
      discountInput.value = amount;
    });

    modal.querySelector('#confirm-discount').addEventListener('click', () => {
      const amount = parseFloat(discountInput.value) || 0;
      if (amount <= 0) {
        alert('Por favor, ingrese un monto de descuento válido.');
        return;
      }
      selectedProducts.push({ isDiscount: true, amount: amount, isFormatted: true });
      updateProductTable();
      closeModal();
    });
  };

  const openPaymentModal = () => {
    const { total, remaining } = calculateTotals();
    if (total <= 0) {
      alert('No hay monto a pagar. Agregue productos.');
      return;
    }

    const modal = document.createElement('div');
    modal.classList.add('modal', 'payment-modal');
    modal.innerHTML = `
      <div class="modal-content payment-modal-content">
        <span class="close">×</span>
        <h2>Medio de Pago</h2>
        <div class="payment-info">
          <p><strong>Total a Pagar:</strong> ${formatPrice(total)}</p>
          <p><strong>Faltante:</strong> <span id="remaining-amount">${formatPrice(remaining)}</span></p>
        </div>
        <div class="input-group">
          <label for="payment-method">Método de Pago:</label>
          <select id="payment-method">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div class="input-group">
          <label for="payment-amount">Monto:</label>
          <div class="price-container">
            <span class="payment-amount-display">${formatPrice(remaining)}</span>
            <input type="number" id="payment-amount" value="${remaining}" style="display: none;">
          </div>
        </div>
        <div class="modal-actions">
          <button id="confirm-payment">Agregar Pago</button>
          <button id="cancel-payment">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.querySelector('#cancel-payment').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const paymentAmountDisplay = modal.querySelector('.payment-amount-display');
    const paymentAmountInput = modal.querySelector('#payment-amount');
    const remainingAmountSpan = modal.querySelector('#remaining-amount');

    paymentAmountDisplay.addEventListener('click', () => {
      paymentAmountDisplay.style.display = 'none';
      paymentAmountInput.style.display = 'inline-block';
      paymentAmountInput.focus();
    });

    paymentAmountInput.addEventListener('blur', () => {
      const newAmount = parseFloat(paymentAmountInput.value) || 0;
      paymentAmountInput.value = newAmount;
      paymentAmountDisplay.textContent = formatPrice(newAmount);
      paymentAmountDisplay.style.display = 'inline-block';
      paymentAmountInput.style.display = 'none';
    });

    paymentAmountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') paymentAmountInput.blur();
    });

    modal.querySelector('#confirm-payment').addEventListener('click', () => {
      const method = modal.querySelector('#payment-method').value;
      const amount = parseFloat(modal.querySelector('#payment-amount').value) || 0;
      if (amount <= 0) {
        alert('Por favor, ingrese un monto de pago válido.');
        return;
      }
      const remaining = parseFloat(remainingAmountSpan.textContent.replace(/[^0-9]/g, '')) || 0;
      if (amount > remaining) {
        alert('El monto de pago no puede ser mayor al faltante.');
        return;
      }
      payments.push({ method: method, amount: amount });
      updateProductTable();
      closeModal();
    });
  };

  const openClientModal = (callback) => {
    let selectedClientId = null;

    const modal = document.createElement('div');
    modal.classList.add('modal', 'client-modal');
    modal.innerHTML = `
      <div class="modal-content client-modal-content">
        <span class="close">×</span>
        <h2>¿A nombre de quién desea la factura?</h2>
        <div class="input-group">
          <label for="client-option">Opción:</label>
          <select id="client-option">
            <option value="na">N/A (Sin cliente)</option>
            <option value="existing">Seleccionar cliente existente</option>
            <option value="new">Registrar nuevo cliente</option>
          </select>
        </div>
        <div id="existing-client-section" style="display: none;">
          <label for="client-search">Buscar Cliente (Nombre, Teléfono, Email):</label>
          <input type="text" id="client-search" placeholder="Ingrese nombre, teléfono o email">
          <div id="client-results"></div>
        </div>
        <div id="new-client-section" style="display: none;">
          <div class="input-group">
            <label for="client-name">Nombre:</label>
            <input type="text" id="client-name" placeholder="Ingrese el nombre" required>
          </div>
          <div class="input-group">
            <label for="client-phone">Teléfono: <span style="color: red;">*</span></label>
            <input type="text" id="client-phone" placeholder="Ingrese el teléfono" required>
          </div>
          <div class="input-group">
            <label for="client-email">Email (opcional):</label>
            <input type="email" id="client-email" placeholder="Ingrese el email">
          </div>
        </div>
        <div class="modal-actions">
          <button id="confirm-client">Confirmar</button>
          <button id="cancel-client">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.querySelector('#cancel-client').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const clientOptionSelect = modal.querySelector('#client-option');
    const existingClientSection = modal.querySelector('#existing-client-section');
    const newClientSection = modal.querySelector('#new-client-section');
    const clientSearchInput = modal.querySelector('#client-search');
    const clientResults = modal.querySelector('#client-results');

    const openEditClientModal = (id, name, phone, email) => {
      const editModal = document.createElement('div');
      editModal.classList.add('modal', 'edit-client-modal');
      editModal.innerHTML = `
        <div class="modal-content edit-client-modal-content">
          <span class="close">×</span>
          <h2>Editar Cliente</h2>
          <div class="input-group">
            <label for="edit-client-name">Nombre:</label>
            <input type="text" id="edit-client-name" value="${name}" placeholder="Ingrese el nombre" required>
          </div>
          <div class="input-group">
            <label for="edit-client-phone">Teléfono: <span style="color: red;">*</span></label>
            <input type="text" id="edit-client-phone" value="${phone}" placeholder="Ingrese el teléfono" required>
          </div>
          <div class="input-group">
            <label for="edit-client-email">Email (opcional):</label>
            <input type="email" id="edit-client-email" value="${email || ''}" placeholder="Ingrese el email">
          </div>
          <div class="modal-actions">
            <button id="confirm-edit-client">Guardar</button>
            <button id="cancel-edit-client">Cancelar</button>
          </div>
        </div>
      `;
      document.body.appendChild(editModal);

      const closeEditModal = () => editModal.remove();
      editModal.querySelector('.close').addEventListener('click', closeEditModal);
      editModal.querySelector('#cancel-edit-client').addEventListener('click', closeEditModal);
      editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    editModal.querySelector('#confirm-edit-client').addEventListener('click', async () => {
      const updatedName = editModal.querySelector('#edit-client-name').value.trim();
      const updatedPhone = editModal.querySelector('#edit-client-phone').value.trim();
      const updatedEmail = editModal.querySelector('#edit-client-email').value.trim();

      if (!updatedName || !updatedPhone) {
        alert('Nombre y teléfono son obligatorios.');
        return;
      }

      try {
        const response = await fetch(`/api/clientes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: updatedName, telefono: updatedPhone, email: updatedEmail })
        });
        const result = await response.json();

        if (response.ok) {
          alert('Cliente actualizado exitosamente.');
          loadClients(clientSearchInput.value); // Refresh client list
          closeEditModal();
        } else if (response.status === 409) {
          let errorMessage = result.error || 'El cliente ya existe.';
          if (result.duplicates) {
            if (result.duplicates.telefono && result.duplicates.email) {
              errorMessage = 'El número de teléfono y el correo electrónico ya están registrados.';
            } else if (result.duplicates.telefono) {
              errorMessage = 'El número de teléfono ya está registrado.';
            } else if (result.duplicates.email) {
              errorMessage = 'El correo electrónico ya está registrado.';
            }
          }
          alert(errorMessage + ' Por favor ingrese datos diferentes.');
        } else {
          throw new Error(result.error || 'Error al actualizar el cliente.');
        }
      } catch (error) {
        console.error('Error actualizando cliente:', error);
        alert('Error al actualizar el cliente: ' + error.message);
      }
    });
    };

    const loadClients = async (searchTerm = '') => {
      try {
        let url = '/api/clientes';
        if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`;
        const response = await fetch(url);
        const clients = await response.json();
        clientResults.innerHTML = '';
        if (clients.length > 0) {
          clients.forEach(client => {
            const div = document.createElement('div');
            div.classList.add('client-result');
            div.innerHTML = `${client.nombre} (${client.telefono})${client.email ? ' - ' + client.email : ''} <button class="edit-client" data-id="${client.id}" data-name="${client.nombre}" data-phone="${client.telefono}" data-email="${client.email}">Editar</button>`;
            div.addEventListener('click', () => {
              selectedClientId = client.id;
            });
            clientResults.appendChild(div);
          });
        } else {
          clientResults.innerHTML = '<div>No se encontraron clientes</div>';
        }
      } catch (error) { console.error('Error cargando clientes:', error); }
    };

    clientSearchInput.addEventListener('input', () => loadClients(clientSearchInput.value));

    clientResults.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-client')) {
        e.preventDefault();
        const { id, name, phone, email } = e.target.dataset;
        openEditClientModal(id, name, phone, email);
      }
    });

    clientOptionSelect.addEventListener('change', () => {
      existingClientSection.style.display = clientOptionSelect.value === 'existing' ? 'block' : 'none';
      newClientSection.style.display = clientOptionSelect.value === 'new' ? 'block' : 'none';
    });

    modal.querySelector('#confirm-client').addEventListener('click', async () => {
      let clientId = selectedClientId;
      const option = clientOptionSelect.value;

      if (option === 'existing' && !clientId) {
        alert('Por favor, seleccione un cliente.');
        return;
      } else if (option === 'new') {
        const name = modal.querySelector('#client-name').value.trim();
        const phone = modal.querySelector('#client-phone').value.trim();
        const email = modal.querySelector('#client-email').value.trim();

        if (!name || !phone) {
          alert('Nombre y teléfono son obligatorios.');
          return;
        }

        try {
          const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: name, telefono: phone, email: email })
          });
          const result = await response.json();
          if (response.ok) {
            clientId = result.id;
          } else if (response.status === 409) {
            let errorMessage = result.error || 'El cliente ya existe.';
            if (result.duplicates) {
              if (result.duplicates.telefono && result.duplicates.email) {
                errorMessage = 'El número de teléfono y el correo electrónico ya están registrados.';
              } else if (result.duplicates.telefono) {
                errorMessage = 'El número de teléfono ya está registrado.';
              } else if (result.duplicates.email) {
                errorMessage = 'El correo electrónico ya está registrado.';
              }
            }
            alert(errorMessage + ' Por favor ingrese datos diferentes.');
            return;
          } else {
            throw new Error(result.error || 'Error al registrar el cliente.');
          }
        } catch (error) {
          console.error('Error registrando cliente:', error);
          alert('Error al registrar el cliente: ' + error.message);
          return;
        }
      }

      callback(clientId);
      closeModal();
    });
  };

  // Modal para seleccionar impresora
  const openPrinterModal = (pdfUrl, invoiceNumber) => {
    const modal = document.createElement('div');
    modal.classList.add('modal', 'printer-modal');
    modal.innerHTML = `
      <div class="modal-content printer-modal-content">
        <span class="close">×</span>
        <h2>Imprimir Factura ${invoiceNumber}</h2>
        <div class="printer-preview">
          <iframe id="pdf-preview" src="${pdfUrl}" style="width: 100%; height: 400px; border: none;"></iframe>
        </div>
        <div class="modal-actions">
          <button id="print-invoice">Imprimir</button>
          <button id="cancel-print">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.querySelector('#cancel-print').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#print-invoice').addEventListener('click', () => {
      const iframe = modal.querySelector('#pdf-preview');
      iframe.contentWindow.print();
      console.log(`Imprimiendo factura ${invoiceNumber}`);
      closeModal();
    });
  };

  const invoiceDateInput = createInvoiceSection.querySelector('#invoice-date');
  const invoiceTimeSpan = createInvoiceSection.querySelector('#invoice-time');
  const timeTravelMessageSpan = createInvoiceSection.querySelector('#time-travel-message');
  const invoiceNumberInput = createInvoiceSection.querySelector('#invoice-number');
  let intervalId;

  const updateTimeAndNumber = () => {
    const selectedDate = new Date(invoiceDateInput.value + 'T00:00:00');
    const currentDate = new Date();
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    if (selectedDateOnly.getTime() < currentDateOnly.getTime()) {
      invoiceTimeSpan.textContent = '00:00:00';
      invoiceTimeSpan.dataset.time = '00:00:00';
      timeTravelMessageSpan.textContent = '¡Viajando al pasado! ⏳';
      timeTravelMessageSpan.style.color = '#FFFFFF';
      clearInterval(intervalId);
      generateInvoiceNumber('ANT').then(newNumber => {
        invoiceNumberInput.value = newNumber;
      });
    } else if (selectedDateOnly.getTime() === currentDateOnly.getTime()) {
      timeTravelMessageSpan.textContent = '';
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const mysqlTime = `${hours}:${minutes}:${seconds}`;
        const displayTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
        invoiceTimeSpan.textContent = displayTime;
        invoiceTimeSpan.dataset.time = mysqlTime;
      }, 1000);
      generateInvoiceNumber('NUV').then(newNumber => {
        invoiceNumberInput.value = newNumber;
      });
    } else {
      console.log('🚫 FUTURO: Fecha es posterior a hoy (no debería ser posible)');
      timeTravelMessageSpan.textContent = '¡No se pueden crear facturas del futuro! 🚫';
      timeTravelMessageSpan.style.color = '#f44336';
      invoiceTimeSpan.textContent = '00:00:00';
      invoiceTimeSpan.dataset.time = '00:00:00';
      clearInterval(intervalId);
    }
  };

  updateTimeAndNumber();
  invoiceDateInput.addEventListener('change', updateTimeAndNumber);

  createInvoiceSection.querySelector('.btn-add-product').addEventListener('click', openAddProductModal);
  createInvoiceSection.querySelector('.btn-delete-product').addEventListener('click', () => {
    const checkboxes = createInvoiceSection.querySelectorAll('.product-checkbox:checked');
    if (checkboxes.length === 0) {
      alert('Por favor, selecciona al menos un producto para eliminar.');
      return;
    }
    const indicesToDelete = Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.index));
    selectedProducts = selectedProducts.filter((_, index) => !indicesToDelete.includes(index));
    updateProductTable();
    createInvoiceSection.querySelector('#select-all-products').checked = false;
  });
  createInvoiceSection.querySelector('.btn-add-discount').addEventListener('click', openDiscountModal);
  createInvoiceSection.querySelector('.btn-payment-method').addEventListener('click', openPaymentModal);
  createInvoiceSection.querySelector('.btn-back-to-billing').addEventListener('click', () => {
    clearInterval(intervalId);
    loadBillingSection();
  });

  createInvoiceSection.querySelector('.btn-finalize-purchase').addEventListener('click', () => {
    const { remaining, total } = calculateTotals();
    if (remaining > 0) {
      alert('Aún falta pagar ' + formatPrice(remaining) + ' para finalizar la compra.');
      return;
    }

    openClientModal(async (clientId) => {
      try {
        const datePart = invoiceDateInput.value;
        const timePart = invoiceTimeSpan.dataset.time || '00:00:00';
        const invoiceDate = `${datePart} ${timePart}`;
        const invoiceNumber = invoiceNumberInput.value;

        const productsList = selectedProducts.filter(item => !item.isDiscount).map(item => ({
          id: item.id,
          codigo: item.codigo,
          nombre: item.nombre,
          cantidad: item.quantity,
          precioUnitario: item.price,
          subtotal: item.quantity * item.price
        }));

        const discountsList = selectedProducts.filter(item => item.isDiscount).map(item => ({
          nombre: 'DESCUENTO',
          monto: item.amount
        }));

        const paymentMethods = payments.map(payment => ({
          metodo: payment.method,
          monto: payment.amount
        }));

        const invoiceDetails = {
          fecha: invoiceDate,
          numeroFactura: invoiceNumber,
          clienteId: clientId,
          vendedorId: vendorId,
          productos: productsList,
          descuentos: discountsList,
          mediosDePago: paymentMethods,
          montoTotal: total
        };

        const response = await fetch('/api/factura', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceDetails)
        }).catch(() => {
          return null;
        });

        if (!response) {
          console.error('Error de red al guardar la factura');
          alert('Error de red al guardar la factura. Intenta de nuevo.');
          return;
        }

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (result.error && result.error.includes('Ey, alimenta el inventario')) {
            selectedProducts = [];
            payments = [];
            updateProductTable();
            alert(result.error);
            return;
          } else {
            throw new Error(result.error || 'Error al guardar la factura');
          }
        }

        console.log('Factura guardada exitosamente:', result);
        invoiceNumberInput.value = result.numeroFactura;

        // Abrir modal de impresión si el PDF se generó
        if (result.pdfPath) {
          openPrinterModal(result.pdfPath, result.numeroFactura);
        } else {
          console.warn('No se generó el PDF para la factura');
          alert('Factura finalizada, pero no se generó el PDF.');
        }

        selectedProducts = [];
        payments = [];
        updateProductTable();

        clearInterval(intervalId);
        alert('¡Factura finalizada! 🎉');

        loadCreateInvoiceSection();

      } catch (error) {
        console.error('Error al finalizar la factura:', error);
        alert('Error al finalizar la factura: ' + error.message);
        selectedProducts = [];
        payments = [];
        updateProductTable();
        loadCreateInvoiceSection();
      }
    });
  });
}

async function fetchLastInvoiceNumber() {
  try {
    // Obtener los últimos números directamente desde el archivo JSON
    const fileResponse = await fetch('/api/get-last-invoice-number');
    const fileData = await fileResponse.json();
    // Asegurarse de que el JSON tenga ambos contadores, si no, inicializarlos
    return {
      lastNUV: fileData.lastNUV || 'NUV-00000',
      lastANT: fileData.lastANT || 'ANT-00000'
    };
  } catch (error) {
    console.error('Error fetching last invoice number from file:', error);
    // Si hay error al leer el archivo, devolver valores predeterminados
    return {
      lastNUV: 'NUV-00000',
      lastANT: 'ANT-00000'
    };
  }
}

async function generateInvoiceNumber(prefix) {
  const lastNumbers = await fetchLastInvoiceNumber();
  // Seleccionar el último número según el prefijo
  const lastNumber = prefix === 'NUV' ? lastNumbers.lastNUV : lastNumbers.lastANT;
  // Extraer el número y aumentarlo
  const currentNumber = parseInt(lastNumber.replace(prefix, '').replace('-', '')) || 0;
  const nextNumber = (currentNumber + 1).toString().padStart(5, '0');
  return `${prefix}-${nextNumber}`;
}

//Buscar Factura  (Acomodar para que cuando se guarde un cliente nuevo, no pida eñ corro como obligatorio)
async function loadSearchInvoiceSection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`; // June 3, 2025

    const searchInvoiceSection = document.createElement('div');
    searchInvoiceSection.classList.add('search-invoice-section');
    searchInvoiceSection.innerHTML = `
        <div class="invoice-header">
            <h1>Buscar Factura</h1>
            <div class="invoice-details">
                <input type="date" id="invoice-date" value="${currentDate}" max="${currentDate}">
                <div id="calendar-container"></div>
                <label for="search-invoice-number">Buscar por Número de Factura:</label>
                <input type="text" id="search-invoice-number" placeholder="Ingrese el número de factura">
                <label for="invoice-select">Seleccionar Factura:</label>
                <select id="invoice-select">
                    <option value="">Seleccione una factura</option>
                </select>
            </div>
        </div>
        <div class="invoice-info">
            <h2>Información de la Factura</h2>
            <div id="invoice-client-info" class="client-info">
                <p><strong>Cliente:</strong> <span id="client-name">N/A</span></p>
                <p><strong>Teléfono:</strong> <span id="client-phone">N/A</span></p>
                <p><strong>Email:</strong> <span id="client-email">N/A</span></p>
            </div>
            <div id="invoice-payment-methods" class="payment-methods">
                <h3>Métodos de Pago</h3>
                <table class="payment-methods-table">
                    <thead>
                        <tr>
                            <th>Método</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody id="payment-methods-table-body">
                        <tr><td colspan="2">Seleccione una factura</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="invoice-products">
            <h2>Productos</h2>
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody id="products-table-body">
                    <tr><td colspan="5">Seleccione una factura</td></tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="total-label">Total:</td>
                        <td id="invoice-total">$0</td>
                    </tr>
                </tfoot>
            </table>
            <button class="btn-reprint-invoice" disabled>Reimprimir Factura</button>
            <button class="btn-back-to-billing">Regresar al Menú de Facturas</button>
        </div>
    `;

    mainContent.appendChild(searchInvoiceSection);

    const formatPrice = (value) => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(numericValue)) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numericValue).replace('COP', '').trim();
    };

    const showLoading = (element, isLoading) => {
        if (isLoading) element.classList.add('loading');
        else element.classList.remove('loading');
    };

    const fetchInvoiceDates = async () => {
        try {
            const response = await fetch('/api/facturacion?startDate=2000-01-01');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid response format');
            const invoiceDates = [...new Set(invoices.map(invoice => 
                new Date(invoice.fecha).toISOString().split('T')[0]
            ))];
            return invoiceDates;
        } catch (error) {
            alert('Error al cargar fechas de facturas: ' + error.message);
            return [];
        }
    };

    const initializeCalendar = async () => {
        const invoiceDates = await fetchInvoiceDates();
        const dateInput = searchInvoiceSection.querySelector('#invoice-date');
        const calendarContainer = searchInvoiceSection.querySelector('#calendar-container');

        const calendar = document.createElement('div');
        calendar.classList.add('calendar');
        calendarContainer.appendChild(calendar);

        const updateCalendar = (selectedDate) => {
            const date = new Date(selectedDate);
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const lastDay = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
            const todayDate = today.getDate();

            calendar.innerHTML = `
                <div class="calendar-header">
                    <button id="prev-month" ${month === 0 ? 'disabled' : ''}><</button>
                    <span>${date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}</span>
                    <button id="next-month" ${isCurrentMonth ? 'disabled' : ''}>></button>
                </div>
                <div class="calendar-grid">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                    ${Array.from({ length: firstDay }, () => '<div></div>').join('')}
                    ${Array.from({ length: lastDay }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isEnabled = invoiceDates.includes(dateStr);
                        const isToday = isCurrentMonth && day === todayDate;
                        return `<div class="calendar-day ${isEnabled ? 'has-invoice' : 'disabled'} ${isToday ? 'today' : ''}" data-date="${dateStr}">${day}</div>`;
                    }).join('')}
                </div>
            `;

            calendar.querySelectorAll('.calendar-day.has-invoice').forEach(day => {
                day.addEventListener('click', () => {
                    dateInput.value = day.dataset.date;
                    fetchInvoicesByDate(day.dataset.date);
                    calendar.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    day.classList.add('selected');
                });
            });

            calendar.querySelector('#prev-month')?.addEventListener('click', () => {
                date.setMonth(date.getMonth() - 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });

            calendar.querySelector('#next-month')?.addEventListener('click', () => {
                if (isCurrentMonth) return;
                date.setMonth(date.getMonth() + 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });
        };

        updateCalendar(dateInput.value);
    };

    const fetchInvoicesByDate = async (date) => {
        const invoiceSelect = searchInvoiceSection.querySelector('#invoice-select');
        invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';
        searchInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">Seleccione una factura</td></tr>';
        searchInvoiceSection.querySelector('#invoice-total').textContent = '$0';
        searchInvoiceSection.querySelector('#client-name').textContent = 'N/A';
        searchInvoiceSection.querySelector('#client-phone').textContent = 'N/A';
        searchInvoiceSection.querySelector('#client-email').textContent = 'N/A';
        searchInvoiceSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">Seleccione una factura</td></tr>';
        searchInvoiceSection.querySelector('.btn-reprint-invoice').disabled = true;

        try {
            showLoading(searchInvoiceSection.querySelector('.invoice-details'), true);
            const response = await fetch(`/api/facturacion?startDate=${date}&endDate=${date}`);
            if (!response.ok) throw new Error('Failed to fetch invoices');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid invoice data format');
            if (invoices.length === 0) {
                invoiceSelect.innerHTML = '<option value="">No hay facturas</option>';
                searchInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">No hay facturas</td></tr>';
                searchInvoiceSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">No hay facturas</td></tr>';
            } else {
                invoices.forEach(invoice => {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `${invoice.numero} - ${new Date(invoice.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}`;
                    invoiceSelect.appendChild(option);
                });
            }
        } catch (error) {
            alert('Error al cargar facturas: ' + error.message);
            invoiceSelect.innerHTML = '<option value="">Error al cargar</option>';
        } finally {
            showLoading(searchInvoiceSection.querySelector('.invoice-details'), false);
        }
    };

    const fetchInvoiceDetails = async (invoiceId) => {
        try {
            showLoading(searchInvoiceSection.querySelector('.invoice-products'), true);
            const response = await fetch(`/api/factura/${invoiceId}`);
            const invoice = await response.json();
            if (!response.ok) throw new Error(invoice.error || 'Error al obtener detalles de la factura');

            console.log('Invoice montoTotal:', invoice.montoTotal, typeof invoice.montoTotal);

            const clientInfo = searchInvoiceSection.querySelector('#invoice-client-info');
            clientInfo.querySelector('#client-name').textContent = invoice.cliente?.nombre || 'N/A';
            clientInfo.querySelector('#client-phone').textContent = invoice.cliente?.telefono || 'N/A';
            clientInfo.querySelector('#client-email').textContent = invoice.cliente?.email || 'N/A';

            const paymentMethodsBody = searchInvoiceSection.querySelector('#payment-methods-table-body');
            paymentMethodsBody.innerHTML = '';
            if (invoice.mediosDePago && invoice.mediosDePago.length > 0) {
                invoice.mediosDePago.forEach(payment => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${payment.metodo.charAt(0).toUpperCase() + payment.metodo.slice(1)}</td>
                        <td>${formatPrice(payment.monto)}</td>
                    `;
                    paymentMethodsBody.appendChild(row);
                });
            } else {
                paymentMethodsBody.innerHTML = '<tr><td colspan="2">No hay métodos de pago registrados</td></tr>';
            }

            const productsBody = searchInvoiceSection.querySelector('#products-table-body');
            productsBody.innerHTML = '';
            let calculatedTotal = 0;
            if (invoice.productos && invoice.productos.length > 0) {
                invoice.productos.forEach(product => {
                    const subtotal = parseFloat(product.subtotal) || 0;
                    calculatedTotal += subtotal;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.codigo || 'N/A'}</td>
                        <td>${product.nombre || 'N/A'}</td>
                        <td>${product.cantidad || 0}</td>
                        <td>${formatPrice(product.precioUnitario)}</td>
                        <td>${formatPrice(subtotal)}</td>
                    `;
                    productsBody.appendChild(row);
                });
            } else {
                productsBody.innerHTML = '<tr><td colspan="5">No hay productos registrados</td></tr>';
            }

            const montoTotal = parseFloat(invoice.montoTotal) || calculatedTotal;
            searchInvoiceSection.querySelector('#invoice-total').textContent = formatPrice(montoTotal);
            searchInvoiceSection.querySelector('.btn-reprint-invoice').disabled = false;
            searchInvoiceSection.querySelector('.btn-reprint-invoice').dataset.invoiceId = invoiceId;
            searchInvoiceSection.querySelector('.btn-reprint-invoice').dataset.clientId = invoice.cliente?.id || '';
            searchInvoiceSection.querySelector('.btn-reprint-invoice').dataset.clientEmail = invoice.cliente?.email || '';
            searchInvoiceSection.querySelector('.btn-reprint-invoice').dataset.clientName = invoice.cliente?.nombre || '';
            searchInvoiceSection.querySelector('.btn-reprint-invoice').dataset.clientPhone = invoice.cliente?.telefono || '';
        } catch (error) {
            alert('Error al cargar detalles de la factura: ' + error.message);
            searchInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">Error al cargar</td></tr>';
            searchInvoiceSection.querySelector('#invoice-total').textContent = '$0';
            searchInvoiceSection.querySelector('.btn-reprint-invoice').disabled = true;
        } finally {
            showLoading(searchInvoiceSection.querySelector('.invoice-products'), false);
        }
    };

    const openConfirmationModal = (message, onConfirm, onCancel) => {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'client-modal');
        modal.innerHTML = `
            <div class="modal-content client-modal-content">
                <span class="close">×</span>
                <h2>Confirmar Acción</h2>
                <p>${message}</p>
                <div class="modal-actions">
                    <button id="confirm-action">Sí</button>
                    <button id="cancel-action">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('.close').addEventListener('click', () => { closeModal(); if (onCancel) onCancel(); });
        modal.querySelector('#cancel-action').addEventListener('click', () => { closeModal(); if (onCancel) onCancel(); });
        modal.addEventListener('click', (e) => { if (e.target === modal) { closeModal(); if (onCancel) onCancel(); } });

        modal.querySelector('#confirm-action').addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
    };

    const openEditClientModal = (clientId, invoiceId, onSuccess, fetchAfterUpdate = true) => {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'client-modal');
        modal.innerHTML = `
            <div class="modal-content client-modal-content">
                <span class="close">×</span>
                <h2>Editar Datos del Cliente</h2>
                <div class="input-group">
                    <label for="client-name">Nombre:</label>
                    <input type="text" id="client-name" placeholder="Ingrese el nombre" required>
                </div>
                <div class="input-group">
                    <label for="client-phone">Teléfono: <span style="color: red;">*</span></label>
                    <input type="text" id="client-phone" placeholder="Ingrese el teléfono" required>
                </div>
                <div class="input-group">
                    <label for="client-email">Email:</label>
                    <input type="email" id="client-email" placeholder="Ingrese el email (opcional)">
                </div>
                <div class="modal-actions">
                    <button id="confirm-client">Confirmar</button>
                    <button id="cancel-client">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Pre-fill inputs with existing client data
        const fetchClientData = async () => {
            try {
                const response = await fetch(`/api/clientes?search=${clientId}`);
                const clients = await response.json();
                const client = clients.find(c => c.id === parseInt(clientId));
                if (client) {
                    modal.querySelector('#client-name').value = client.nombre || '';
                    modal.querySelector('#client-phone').value = client.telefono || '';
                    modal.querySelector('#client-email').value = client.email || '';
                }
            } catch (error) {
                console.error('Error al cargar datos del cliente:', error);
            }
        };
        fetchClientData();

        const closeModal = () => modal.remove();
        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-client').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modal.querySelector('#confirm-client').addEventListener('click', async () => {
            const name = modal.querySelector('#client-name').value.trim();
            const phone = modal.querySelector('#client-phone').value.trim();
            const email = modal.querySelector('#client-email').value.trim();

            if (!name || !phone) {
                alert('Nombre y teléfono son obligatorios.');
                return;
            }

            try {
                const response = await fetch(`/api/clientes/${clientId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: name, telefono: phone, email: email || null })
                });
                const result = await response.json();
                if (!response.ok) {
                    let errorMessage = result.error || 'Error al actualizar el cliente.';
                    if (result.duplicates) {
                        if (result.duplicates.telefono && result.duplicates.email) {
                            errorMessage = 'El número de teléfono y el correo electrónico ya están registrados.';
                        } else if (result.duplicates.telefono) {
                            errorMessage = 'El número de teléfono ya está registrado.';
                        } else if (result.duplicates.email) {
                            errorMessage = 'El correo electrónico ya está registrado.';
                        }
                    }
                    alert(errorMessage + ' Por favor ingrese datos diferentes.');
                    return;
                }

                alert('Cliente actualizado correctamente.');
                if (fetchAfterUpdate) {
                    await fetchInvoiceDetails(invoiceId);
                }
                closeModal();
                if (onSuccess) onSuccess({ id: clientId, nombre: name, telefono: phone, email: email || null });
            } catch (error) {
                alert('Error al actualizar el cliente: ' + error.message);
            }
        });
    };

    const sendInvoiceEmail = async (invoiceId, email) => {
        try {
            const response = await fetch(`/api/factura/${invoiceId}/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al enviar el correo');
            return result;
        } catch (error) {
            throw error;
        }
    };

    const openPrinterModal = (pdfUrl, invoiceId) => {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'client-modal');
        modal.innerHTML = `
            <div class="modal-content client-modal-content">
                <span class="close">×</span>
                <h2>Imprimir Factura</h2>
                <iframe src="${pdfUrl}" style="width: 100%; height: 400px; border: none;" title="Factura PDF"></iframe>
                <div class="modal-actions">
                    <button id="print-invoice">Imprimir</button>
                    <button id="close-print-modal">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.querySelector('#close-print-modal').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modal.querySelector('#print-invoice').addEventListener('click', () => {
            const iframe = modal.querySelector('iframe');
            iframe.contentWindow.print();
        });
    };

    const openClientModal = (callback) => {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'client-modal');
        modal.innerHTML = `
            <div class="modal-content client-modal-content">
                <span class="close">×</span>
                <h2>Nuevo Cliente</h2>
                <div class="input-group">
                    <label for="new-client-name">Nombre:</label>
                    <input type="text" id="new-client-name" placeholder="Ingrese el nombre" required>
                </div>
                <div class="input-group">
                    <label for="new-client-phone">Teléfono: <span style="color: red;">*</span></label>
                    <input type="text" id="new-client-phone" placeholder="Ingrese el teléfono" required>
                </div>
                <div class="input-group">
                    <label for="new-client-email">Email:</label>
                    <input type="email" id="new-client-email" placeholder="Ingrese el email (opcional)">
                </div>
                <div class="modal-actions">
                    <button id="confirm-new-client">Confirmar</button>
                    <button id="cancel-new-client">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-new-client').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modal.querySelector('#confirm-new-client').addEventListener('click', async () => {
            const name = modal.querySelector('#new-client-name').value.trim();
            const phone = modal.querySelector('#new-client-phone').value.trim();
            const email = modal.querySelector('#new-client-email').value.trim();

            if (!name || !phone) {
                alert('Nombre y teléfono son obligatorios.');
                return;
            }

            try {
                const response = await fetch('/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: name, telefono: phone, email: email || null })
                });
                const result = await response.json();
                if (!response.ok) {
                    let errorMessage = result.error || 'Error al crear el cliente.';
                    if (result.duplicates) {
                        if (result.duplicates.telefono && result.duplicates.email) {
                            errorMessage = 'El número de teléfono y el correo electrónico ya están registrados.';
                        } else if (result.duplicates.telefono) {
                            errorMessage = 'El número de teléfono ya está registrado.';
                        } else if (result.duplicates.email) {
                            errorMessage = 'El correo electrónico ya está registrado.';
                        }
                    }
                    throw new Error(errorMessage);
                }
                alert('Cliente creado correctamente.');
                callback(result.id, { nombre: name, telefono: phone, email: email || null });
                closeModal();
            } catch (error) {
                alert('Error al crear el cliente: ' + error.message);
            }
        });
    };

    const handleReprintInvoice = async (invoiceId, clientId, clientEmail, clientName, clientPhone) => {
        try {
            showLoading(searchInvoiceSection.querySelector('.btn-reprint-invoice'), true);
            const response = await fetch(`/api/factura/pdf/${invoiceId}`);
            if (!response.ok) throw new Error('Error al obtener el PDF de la factura');
            const pdfUrl = `/api/factura/pdf/${invoiceId}`;

            // Case 1: No client or missing client details (name, phone, or email)
            const hasClientDetails = clientId && clientName !== 'N/A' && clientPhone !== 'N/A';
            if (!hasClientDetails) {
                openConfirmationModal(
                    'La factura no tiene cliente registrado o faltan datos (nombre, teléfono o email). ¿Desea registrar un cliente antes de imprimir?',
                    () => {
                        // User wants to add a client
                        openClientModal(async (newClientId, newClientDetails) => {
                            if (newClientId) {
                                // Update invoice with new client ID (if needed on backend)
                                try {
                                    // Optionally update the invoice with the new client ID if your backend supports it
                                    const updateResponse = await fetch(`/api/factura/${invoiceId}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ cliente_id: newClientId })
                                    });
                                    if (!updateResponse.ok) throw new Error('Error al asociar el cliente a la factura');

                                    await fetchInvoiceDetails(invoiceId);

                                    // Check if the new client has an email to send
                                    if (newClientDetails.email) {
                                        openConfirmationModal(
                                            `¿Desea enviar la factura al correo ${newClientDetails.email}?`,
                                            async () => {
                                                await sendInvoiceEmail(invoiceId, newClientDetails.email);
                                                alert('Factura enviada por correo.');
                                                openPrinterModal(pdfUrl, invoiceId);
                                            },
                                            () => openPrinterModal(pdfUrl, invoiceId)
                                        );
                                    } else {
                                        openPrinterModal(pdfUrl, invoiceId);
                                    }
                                } catch (error) {
                                    alert('Error al procesar el cliente: ' + error.message);
                                    openPrinterModal(pdfUrl, invoiceId); // Fallback to printing
                                }
                            }
                        });
                    },
                    () => openPrinterModal(pdfUrl, invoiceId) // User doesn't want to add a client, print as is
                );
                return;
            }

            // Case 2: Client exists and has an email
            if (clientEmail && clientEmail !== 'N/A') {
                openConfirmationModal(
                    `El cliente tiene un correo registrado (${clientEmail}). ¿Desea reenviar la factura a este correo?`,
                    async () => {
                        try {
                            await sendInvoiceEmail(invoiceId, clientEmail);
                            alert('Factura enviada por correo.');
                            openPrinterModal(pdfUrl, invoiceId);
                        } catch (error) {
                            alert('Error al enviar el correo: ' + error.message);
                            openPrinterModal(pdfUrl, invoiceId); // Proceed to print even if email fails
                        }
                    },
                    () => openPrinterModal(pdfUrl, invoiceId) // User doesn't want to send email
                );
                return;
            }

            // Case 3: Client exists but has no email
            openConfirmationModal(
                'El cliente no tiene un correo registrado. ¿Desea agregar un correo para enviar la factura?',
                () => {
                    openEditClientModal(clientId, invoiceId, async (updatedClient) => {
                        if (updatedClient.email) {
                            openConfirmationModal(
                                `¿Desea enviar la factura al correo ${updatedClient.email}?`,
                                async () => {
                                    await sendInvoiceEmail(invoiceId, updatedClient.email);
                                    alert('Factura enviada por correo.');
                                    openPrinterModal(pdfUrl, invoiceId);
                                },
                                () => openPrinterModal(pdfUrl, invoiceId)
                            );
                        } else {
                            openPrinterModal(pdfUrl, invoiceId);
                        }
                    });
                },
                () => openPrinterModal(pdfUrl, invoiceId) // User doesn't want to add an email
            );
        } catch (error) {
            alert('Error al procesar la reimpresión: ' + error.message);
        } finally {
            showLoading(searchInvoiceSection.querySelector('.btn-reprint-invoice'), false);
        }
    };

    initializeCalendar();
    fetchInvoicesByDate(currentDate);

    const dateInput = searchInvoiceSection.querySelector('#invoice-date');
    dateInput.addEventListener('change', () => fetchInvoicesByDate(dateInput.value));

    const searchInput = searchInvoiceSection.querySelector('#search-invoice-number');
    searchInput.addEventListener('input', debounce(async (e) => {
        const searchTerm = e.target.value.trim();
        const date = dateInput.value;
        const invoiceSelect = searchInvoiceSection.querySelector('#invoice-select');
        invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';

        try {
            showLoading(searchInvoiceSection.querySelector('.invoice-details'), true);
            const response = await fetch(`/api/facturacion?search=${encodeURIComponent(searchTerm)}&startDate=${date}&endDate=${date}`);
            if (!response.ok) throw new Error('Failed to search invoices');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid invoice data format');
            invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';
            if (invoices.length === 0) {
                alert('No se encontraron facturas con el número ingresado.');
            } else {
                invoices.forEach(invoice => {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `${invoice.numero} - ${new Date(invoice.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}`;
                    invoiceSelect.appendChild(option);
                });
            }
        } catch (error) {
            alert('Error al buscar facturas: ' + error.message);
            invoiceSelect.innerHTML = '<option value="">Error al cargar</option>';
        } finally {
            showLoading(searchInvoiceSection.querySelector('.invoice-details'), false);
        }
    }, 300));

    searchInvoiceSection.querySelector('#invoice-select').addEventListener('change', (e) => {
        const invoiceId = e.target.value;
        if (invoiceId) {
            fetchInvoiceDetails(invoiceId);
        } else {
            searchInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">Seleccione una factura</td></tr>';
            searchInvoiceSection.querySelector('#invoice-total').textContent = '$0';
            searchInvoiceSection.querySelector('#client-name').textContent = 'N/A';
            searchInvoiceSection.querySelector('#client-phone').textContent = 'N/A';
            searchInvoiceSection.querySelector('#client-email').textContent = 'N/A';
            searchInvoiceSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">Seleccione una factura</td></tr>';
            searchInvoiceSection.querySelector('.btn-reprint-invoice').disabled = true;
        }
    });

    searchInvoiceSection.querySelector('.btn-reprint-invoice').addEventListener('click', (e) => {
        const invoiceId = e.target.dataset.invoiceId;
        const clientId = e.target.dataset.clientId;
        const clientEmail = e.target.dataset.clientEmail;
        const clientName = e.target.dataset.clientName;
        const clientPhone = e.target.dataset.clientPhone;
        if (!invoiceId) {
            alert('Seleccione una factura para reimprimir.');
            return;
        }
        handleReprintInvoice(invoiceId, clientId, clientEmail, clientName, clientPhone);
    });

    searchInvoiceSection.querySelector('.btn-back-to-billing').addEventListener('click', () => {
        loadBillingSection();
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Devolver Unidades
async function loadReturnUnitsSection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`; // 2025-06-03

    const returnUnitsSection = document.createElement('div');
    returnUnitsSection.classList.add('search-invoice-section');
    returnUnitsSection.innerHTML = `
        <div class="invoice-header">
            <h1>Devolver Unidades</h1>
            <div class="invoice-details">
                <input type="date" id="invoice-date" value="${currentDate}" max="${currentDate}">
                <div id="calendar-container"></div>
                <label for="search-invoice-number">Buscar por Número de Factura:</label>
                <input type="text" id="search-invoice-number" placeholder="Ingrese el número de factura">
                <label for="invoice-select">Seleccionar Factura:</label>
                <select id="invoice-select">
                    <option value="">Seleccione una factura</option>
                </select>
            </div>
        </div>
        <div class="invoice-info">
            <h2>Información de la Factura</h2>
            <div id="invoice-client-info" class="client-info">
                <p><strong>Cliente:</strong> <span id="client-name">N/A</span></p>
                <p><strong>Teléfono:</strong> <span id="client-phone">N/A</span></p>
                <p><strong>Email:</strong> <span id="client-email">N/A</span></p>
            </div>
            <div id="invoice-payment-methods" class="payment-methods">
                <h3>Métodos de Pago</h3>
                <table class="payment-methods-table">
                    <thead>
                        <tr>
                            <th>Método</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody id="payment-methods-table-body">
                        <tr><td colspan="2">Seleccione una factura</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="invoice-products">
            <h2>Productos</h2>
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Cantidad Comprada</th>
                        <th>Cantidades Devueltas</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="products-table-body">
                    <tr><td colspan="7">Seleccione una factura</td></tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="6" class="total-label">Total:</td>
                        <td id="invoice-total">$0</td>
                    </tr>
                </tfoot>
            </table>
            <button class="btn-back-to-billing">Regresar al Menú de Facturas</button>
        </div>
    `;

    mainContent.appendChild(returnUnitsSection);

    const formatPrice = (value) => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(numericValue)) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numericValue).replace('COP', '').trim();
    };

    const showLoading = (element, isLoading) => {
        if (isLoading) element.classList.add('loading');
        else element.classList.remove('loading');
    };

    const fetchInvoiceDates = async () => {
        try {
            const response = await fetch('/api/facturacion?startDate=2000-01-01');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid response format');
            const invoiceDates = [...new Set(invoices.map(invoice => 
                new Date(invoice.fecha).toISOString().split('T')[0]
            ))];
            return invoiceDates;
        } catch (error) {
            alert('Error al cargar fechas de facturas: ' + error.message);
            return [];
        }
    };

    const initializeCalendar = async () => {
        const invoiceDates = await fetchInvoiceDates();
        const dateInput = returnUnitsSection.querySelector('#invoice-date');
        const calendarContainer = returnUnitsSection.querySelector('#calendar-container');

        const calendar = document.createElement('div');
        calendar.classList.add('calendar');
        calendarContainer.appendChild(calendar);

        const updateCalendar = (selectedDate) => {
            const date = new Date(selectedDate);
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const lastDay = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
            const todayDate = today.getDate();

            calendar.innerHTML = `
                <div class="calendar-header">
                    <button id="prev-month" ${month === 0 ? 'disabled' : ''}><</button>
                    <span>${date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}</span>
                    <button id="next-month" ${isCurrentMonth ? 'disabled' : ''}>></button>
                </div>
                <div class="calendar-grid">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                    ${Array.from({ length: firstDay }, () => '<div></div>').join('')}
                    ${Array.from({ length: lastDay }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isEnabled = invoiceDates.includes(dateStr);
                        const isToday = isCurrentMonth && day === todayDate;
                        return `<div class="calendar-day ${isEnabled ? 'has-invoice' : 'disabled'} ${isToday ? 'today' : ''}" data-date="${dateStr}">${day}</div>`;
                    }).join('')}
                </div>
            `;

            calendar.querySelectorAll('.calendar-day.has-invoice').forEach(day => {
                day.addEventListener('click', () => {
                    dateInput.value = day.dataset.date;
                    fetchInvoicesByDate(day.dataset.date);
                    calendar.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    day.classList.add('selected');
                });
            });

            calendar.querySelector('#prev-month')?.addEventListener('click', () => {
                date.setMonth(date.getMonth() - 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });

            calendar.querySelector('#next-month')?.addEventListener('click', () => {
                if (isCurrentMonth) return;
                date.setMonth(date.getMonth() + 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });
        };

        updateCalendar(dateInput.value);
    };

    const fetchInvoicesByDate = async (date) => {
        const invoiceSelect = returnUnitsSection.querySelector('#invoice-select');
        invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';
        returnUnitsSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="7">Seleccione una factura</td></tr>';
        returnUnitsSection.querySelector('#invoice-total').textContent = '$0';
        returnUnitsSection.querySelector('#client-name').textContent = 'N/A';
        returnUnitsSection.querySelector('#client-phone').textContent = 'N/A';
        returnUnitsSection.querySelector('#client-email').textContent = 'N/A';
        returnUnitsSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">Seleccione una factura</td></tr>';

        try {
            showLoading(returnUnitsSection.querySelector('.invoice-details'), true);
            const response = await fetch(`/api/facturacion?startDate=${date}&endDate=${date}`);
            if (!response.ok) throw new Error('Failed to fetch invoices');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid invoice data format');
            if (invoices.length === 0) {
                invoiceSelect.innerHTML = '<option value="">No hay facturas</option>';
                returnUnitsSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="7">No hay facturas</td></tr>';
                returnUnitsSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">No hay facturas</td></tr>';
            } else {
                invoices.forEach(invoice => {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `${invoice.numero} - ${new Date(invoice.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}`;
                    invoiceSelect.appendChild(option);
                });
            }
        } catch (error) {
            alert('Error al cargar facturas: ' + error.message);
            invoiceSelect.innerHTML = '<option value="">Error al cargar</option>';
        } finally {
            showLoading(returnUnitsSection.querySelector('.invoice-details'), false);
        }
    };

    const fetchInvoiceDetails = async (invoiceId) => {
        try {
            showLoading(returnUnitsSection.querySelector('.invoice-products'), true);
            const response = await fetch(`/api/factura/${invoiceId}`);
            const invoice = await response.json();
            if (!response.ok) throw new Error(invoice.error || 'Error al obtener detalles de la factura');

            const clientInfo = returnUnitsSection.querySelector('#invoice-client-info');
            clientInfo.querySelector('#client-name').textContent = invoice.cliente?.nombre || 'N/A';
            clientInfo.querySelector('#client-phone').textContent = invoice.cliente?.telefono || 'N/A';
            clientInfo.querySelector('#client-email').textContent = invoice.cliente?.email || 'N/A';

            const paymentMethodsBody = returnUnitsSection.querySelector('#payment-methods-table-body');
            paymentMethodsBody.innerHTML = '';
            if (invoice.mediosDePago && invoice.mediosDePago.length > 0) {
                invoice.mediosDePago.forEach(payment => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${payment.metodo.charAt(0).toUpperCase() + payment.metodo.slice(1)}</td>
                        <td>${formatPrice(payment.monto)}</td>
                    `;
                    paymentMethodsBody.appendChild(row);
                });
            } else {
                paymentMethodsBody.innerHTML = '<tr><td colspan="2">No hay métodos de pago registrados</td></tr>';
            }

            const productsBody = returnUnitsSection.querySelector('#products-table-body');
            productsBody.innerHTML = '';
            let calculatedTotal = 0;
            if (invoice.productos && invoice.productos.length > 0) {
                for (const product of invoice.productos) {
                    const returnResponse = await fetch(`/api/devoluciones/${invoiceId}/${product.producto_id}`);
                    const returnData = await returnResponse.json();
                    if (!returnResponse.ok) throw new Error(returnData.error || 'Error al obtener datos de devoluciones');

                    const totalReturned = returnData.reduce((sum, dev) => sum + dev.cantidad, 0);

                    const subtotal = parseFloat(product.subtotal) || 0;
                    calculatedTotal += subtotal;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.codigo || 'N/A'}</td>
                        <td>${product.nombre || 'N/A'}</td>
                        <td>${product.cantidad || 0}</td>
                        <td>${totalReturned}</td>
                        <td>${formatPrice(product.precioUnitario)}</td>
                        <td>${formatPrice(subtotal)}</td>
                        <td>
                            <button class="btn-return-product" data-invoice-id="${invoiceId}" data-product-id="${product.producto_id}" data-detalle-id="${product.detalle_id}" data-name="${product.nombre}">Devolver</button>
                        </td>
                    `;
                    productsBody.appendChild(row);
                }

                // Attach event listeners to all "Devolver" buttons
                const returnButtons = productsBody.querySelectorAll('.btn-return-product');
                returnButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const invoiceId = button.dataset.invoiceId;
                        const productId = button.dataset.productId;
                        const detalleId = button.dataset.detalleId;
                        const productName = button.dataset.name;
                        openReturnModal(invoiceId, productId, detalleId, productName);
                    });
                });
            } else {
                productsBody.innerHTML = '<tr><td colspan="7">No hay productos registrados</td></tr>';
            }

            const montoTotal = parseFloat(invoice.montoTotal) || calculatedTotal;
            returnUnitsSection.querySelector('#invoice-total').textContent = formatPrice(montoTotal);

            // Mostrar notificación si la factura tiene devoluciones
            if (invoice.estado === 'parcialmente_devuelta') {
                alert('Esta factura tiene productos devueltos.');
            }
        } catch (error) {
            alert('Error al cargar detalles de la factura: ' + error.message);
            returnUnitsSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="7">Error al cargar</td></tr>';
            returnUnitsSection.querySelector('#invoice-total').textContent = '$0';
        } finally {
            showLoading(returnUnitsSection.querySelector('.invoice-products'), false);
        }
    };

    const openReturnModal = (invoiceId, productId, detalleId, productName) => {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'client-modal');
        modal.innerHTML = `
            <div class="modal-content client-modal-content">
                <span class="close">×</span>
                <h2>Devolver Producto</h2>
                <div class="input-group">
                    <p><strong>Producto:</strong> ${productName}</p>
                </div>
                <div class="input-group">
                    <label for="return-quantity">Cantidad a Devolver:</label>
                    <input type="number" id="return-quantity" min="1" value="1">
                </div>
                <div class="input-group">
                    <label for="return-reason">Razón de la Devolución:</label>
                    <textarea id="return-reason" placeholder="Describa la razón de la devolución" required></textarea>
                </div>
                <div class="modal-actions">
                    <button id="confirm-action">Confirmar</button>
                    <button id="cancel-action">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-action').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modal.querySelector('#confirm-action').addEventListener('click', async () => {
            const quantity = parseInt(modal.querySelector('#return-quantity').value) || 0;
            const reason = modal.querySelector('#return-reason').value.trim();

            if (quantity <= 0) {
                alert('La cantidad a devolver debe ser mayor a 0.');
                return;
            }
            if (!reason) {
                alert('La razón de la devolución es obligatoria.');
                return;
            }

            try {
                const returnResponse = await fetch('/api/devoluciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        factura_id: invoiceId,
                        detalle_factura_id: detalleId,
                        producto_id: productId,
                        cantidad: quantity,
                        razon: reason
                    })
                });
                const returnResult = await returnResponse.json();
                if (!returnResponse.ok) throw new Error(returnResult.error || 'Error al registrar la devolución');

                alert('Devolución registrada exitosamente. Se ha entregado un producto nuevo.');
                closeModal();
                fetchInvoiceDetails(invoiceId);
            } catch (error) {
                alert('Error al procesar la devolución: ' + error.message);
            }
        });
    };

    initializeCalendar();
    fetchInvoicesByDate(currentDate);

    const dateInput = returnUnitsSection.querySelector('#invoice-date');
    dateInput.addEventListener('change', () => fetchInvoicesByDate(dateInput.value));

    const searchInput = returnUnitsSection.querySelector('#search-invoice-number');
    searchInput.addEventListener('input', debounce(async (e) => {
        const searchTerm = e.target.value.trim();
        const date = dateInput.value;
        const invoiceSelect = returnUnitsSection.querySelector('#invoice-select');
        invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';

        try {
            showLoading(returnUnitsSection.querySelector('.invoice-details'), true);
            const response = await fetch(`/api/facturacion?search=${encodeURIComponent(searchTerm)}&startDate=${date}&endDate=${date}`);
            if (!response.ok) throw new Error('Failed to search invoices');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid invoice data format');
            invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';
            if (invoices.length === 0) {
                alert('No se encontraron facturas con el número ingresado.');
            } else {
                invoices.forEach(invoice => {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `${invoice.numero} - ${new Date(invoice.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}`;
                    invoiceSelect.appendChild(option);
                });
            }
        } catch (error) {
            alert('Error al buscar facturas: ' + error.message);
            invoiceSelect.innerHTML = '<option value="">Error al cargar</option>';
        } finally {
            showLoading(returnUnitsSection.querySelector('.invoice-details'), false);
        }
    }, 300));

    returnUnitsSection.querySelector('#invoice-select').addEventListener('change', (e) => {
        const invoiceId = e.target.value;
        if (invoiceId) {
            fetchInvoiceDetails(invoiceId);
        } else {
            returnUnitsSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="7">Seleccione una factura</td></tr>';
            returnUnitsSection.querySelector('#invoice-total').textContent = '$0';
            returnUnitsSection.querySelector('#client-name').textContent = 'N/A';
            returnUnitsSection.querySelector('#client-phone').textContent = 'N/A';
            returnUnitsSection.querySelector('#client-email').textContent = 'N/A';
            returnUnitsSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">Seleccione una factura</td></tr>';
        }
    });

    returnUnitsSection.querySelector('.btn-back-to-billing').addEventListener('click', () => {
        loadBillingSection();
    });
}

// Cancelar Facturas
async function loadCancelInvoiceSection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`; // 2025-06-03

    const cancelInvoiceSection = document.createElement('div');
    cancelInvoiceSection.classList.add('search-invoice-section');
    cancelInvoiceSection.innerHTML = `
        <div class="invoice-header">
            <h1>Cancelar Factura</h1>
            <div class="invoice-details">
                <input type="date" id="invoice-date" value="${currentDate}" max="${currentDate}">
                <div id="calendar-container"></div>
                <label for="search-invoice-number">Buscar por Número de Factura:</label>
                <input type="text" id="search-invoice-number" placeholder="Ingrese el número de factura">
                <label for="invoice-select">Seleccionar Factura:</label>
                <select id="invoice-select">
                    <option value="">Seleccione una factura</option>
                </select>
            </div>
        </div>
        <div class="invoice-info">
            <h2>Información de la Factura</h2>
            <div id="invoice-client-info" class="client-info">
                <p><strong>Cliente:</strong> <span id="client-name">N/A</span></p>
                <p><strong>Teléfono:</strong> <span id="client-phone">N/A</span></p>
                <p><strong>Email:</strong> <span id="client-email">N/A</span></p>
            </div>
            <div id="invoice-payment-methods" class="payment-methods">
                <h3>Métodos de Pago</h3>
                <table class="payment-methods-table">
                    <thead>
                        <tr>
                            <th>Método</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody id="payment-methods-table-body">
                        <tr><td colspan="2">Seleccione una factura</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="invoice-products">
            <h2>Productos</h2>
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Cantidad Comprada</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody id="products-table-body">
                    <tr><td colspan="5">Seleccione una factura</td></tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="total-label">Total:</td>
                        <td id="invoice-total">$0</td>
                    </tr>
                </tfoot>
            </table>
            <button class="btn-back-to-billing">Regresar al Menú de Facturas</button>
            <button class="btn-cancel-invoice">Cancelar Factura</button>
        </div>
    `;

    mainContent.appendChild(cancelInvoiceSection);

    const formatPrice = (value) => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(numericValue)) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numericValue).replace('COP', '').trim();
    };

    const showLoading = (element, isLoading) => {
        if (isLoading) element.classList.add('loading');
        else element.classList.remove('loading');
    };

    const resetSection = () => {
        const invoiceSelect = cancelInvoiceSection.querySelector('#invoice-select');
        invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';
        invoiceSelect.value = '';
        cancelInvoiceSection.querySelector('#search-invoice-number').value = '';
        cancelInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">Seleccione una factura</td></tr>';
        cancelInvoiceSection.querySelector('#invoice-total').textContent = '$0';
        cancelInvoiceSection.querySelector('#client-name').textContent = 'N/A';
        cancelInvoiceSection.querySelector('#client-phone').textContent = 'N/A';
        cancelInvoiceSection.querySelector('#client-email').textContent = 'N/A';
        cancelInvoiceSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">Seleccione una factura</td></tr>';
    };

    const fetchInvoiceDates = async () => {
        try {
            const response = await fetch('/api/facturacion?startDate=2000-01-01');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid response format');
            const invoiceDates = [...new Set(invoices.map(invoice => 
                new Date(invoice.fecha).toISOString().split('T')[0]
            ))];
            return invoiceDates;
        } catch (error) {
            alert('Error al cargar fechas de facturas: ' + error.message);
            return [];
        }
    };

    const initializeCalendar = async () => {
        const invoiceDates = await fetchInvoiceDates();
        const dateInput = cancelInvoiceSection.querySelector('#invoice-date');
        const calendarContainer = cancelInvoiceSection.querySelector('#calendar-container');

        const calendar = document.createElement('div');
        calendar.classList.add('calendar');
        calendarContainer.appendChild(calendar);

        const updateCalendar = (selectedDate) => {
            const date = new Date(selectedDate);
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const lastDay = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
            const todayDate = today.getDate();

            calendar.innerHTML = `
                <div class="calendar-header">
                    <button id="prev-month" ${month === 0 ? 'disabled' : ''}><</button>
                    <span>${date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}</span>
                    <button id="next-month" ${isCurrentMonth ? 'disabled' : ''}>></button>
                </div>
                <div class="calendar-grid">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                    ${Array.from({ length: firstDay }, () => '<div></div>').join('')}
                    ${Array.from({ length: lastDay }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isEnabled = invoiceDates.includes(dateStr);
                        const isToday = isCurrentMonth && day === todayDate;
                        return `<div class="calendar-day ${isEnabled ? 'has-invoice' : 'disabled'} ${isToday ? 'today' : ''}" data-date="${dateStr}">${day}</div>`;
                    }).join('')}
                </div>
            `;

            calendar.querySelectorAll('.calendar-day.has-invoice').forEach(day => {
                day.addEventListener('click', () => {
                    dateInput.value = day.dataset.date;
                    fetchInvoicesByDate(day.dataset.date);
                    calendar.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    day.classList.add('selected');
                });
            });

            calendar.querySelector('#prev-month')?.addEventListener('click', () => {
                date.setMonth(date.getMonth() - 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });

            calendar.querySelector('#next-month')?.addEventListener('click', () => {
                if (isCurrentMonth) return;
                date.setMonth(date.getMonth() + 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });
        };

        updateCalendar(dateInput.value);
    };

    const fetchInvoicesByDate = async (date) => {
        const invoiceSelect = cancelInvoiceSection.querySelector('#invoice-select');
        invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';
        cancelInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">Seleccione una factura</td></tr>';
        cancelInvoiceSection.querySelector('#invoice-total').textContent = '$0';
        cancelInvoiceSection.querySelector('#client-name').textContent = 'N/A';
        cancelInvoiceSection.querySelector('#client-phone').textContent = 'N/A';
        cancelInvoiceSection.querySelector('#client-email').textContent = 'N/A';
        cancelInvoiceSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">Seleccione una factura</td></tr>';

        try {
            showLoading(cancelInvoiceSection.querySelector('.invoice-details'), true);
            const response = await fetch(`/api/facturacion?startDate=${date}&endDate=${date}`);
            if (!response.ok) throw new Error('Failed to fetch invoices');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid invoice data format');
            if (invoices.length === 0) {
                invoiceSelect.innerHTML = '<option value="">No hay facturas</option>';
                cancelInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">No hay facturas</td></tr>';
                cancelInvoiceSection.querySelector('#payment-methods-table-body').innerHTML = '<tr><td colspan="2">No hay facturas</td></tr>';
            } else {
                invoices.forEach(invoice => {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `${invoice.numero} - ${new Date(invoice.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}`;
                    invoiceSelect.appendChild(option);
                });
            }
        } catch (error) {
            alert('Error al cargar facturas: ' + error.message);
            invoiceSelect.innerHTML = '<option value="">Error al cargar</option>';
        } finally {
            showLoading(cancelInvoiceSection.querySelector('.invoice-details'), false);
        }
    };

    const fetchInvoiceDetails = async (invoiceId) => {
        try {
            showLoading(cancelInvoiceSection.querySelector('.invoice-products'), true);
            const response = await fetch(`/api/factura/${invoiceId}`);
            const invoice = await response.json();
            if (!response.ok) throw new Error(invoice.error || 'Error al obtener detalles de la factura');

            const clientInfo = cancelInvoiceSection.querySelector('#invoice-client-info');
            clientInfo.querySelector('#client-name').textContent = invoice.cliente?.nombre || 'N/A';
            clientInfo.querySelector('#client-phone').textContent = invoice.cliente?.telefono || 'N/A';
            clientInfo.querySelector('#client-email').textContent = invoice.cliente?.email || 'N/A';

            const paymentMethodsBody = cancelInvoiceSection.querySelector('#payment-methods-table-body');
            paymentMethodsBody.innerHTML = '';
            if (invoice.mediosDePago && invoice.mediosDePago.length > 0) {
                invoice.mediosDePago.forEach(payment => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${payment.metodo.charAt(0).toUpperCase() + payment.metodo.slice(1)}</td>
                        <td>${formatPrice(payment.monto)}</td>
                    `;
                    paymentMethodsBody.appendChild(row);
                });
            } else {
                paymentMethodsBody.innerHTML = '<tr><td colspan="2">No hay métodos de pago registrados</td></tr>';
            }

            const productsBody = cancelInvoiceSection.querySelector('#products-table-body');
            productsBody.innerHTML = '';
            let calculatedTotal = 0;
            if (invoice.productos && invoice.productos.length > 0) {
                for (const product of invoice.productos) {
                    const subtotal = parseFloat(product.subtotal) || 0;
                    calculatedTotal += subtotal;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.codigo || 'N/A'}</td>
                        <td>${product.nombre || 'N/A'}</td>
                        <td>${product.cantidad || 0}</td>
                        <td>${formatPrice(product.precioUnitario)}</td>
                        <td>${formatPrice(subtotal)}</td>
                    `;
                    productsBody.appendChild(row);
                }
            } else {
                productsBody.innerHTML = '<tr><td colspan="5">No hay productos registrados</td></tr>';
            }

            const montoTotal = parseFloat(invoice.montoTotal) || calculatedTotal;
            cancelInvoiceSection.querySelector('#invoice-total').textContent = formatPrice(montoTotal);
        } catch (error) {
            alert('Error al cargar detalles de la factura: ' + error.message);
            cancelInvoiceSection.querySelector('#products-table-body').innerHTML = '<tr><td colspan="5">Error al cargar</td></tr>';
            cancelInvoiceSection.querySelector('#invoice-total').textContent = '$0';
        } finally {
            showLoading(cancelInvoiceSection.querySelector('.invoice-products'), false);
        }
    };

    initializeCalendar();
    fetchInvoicesByDate(currentDate);

    const dateInput = cancelInvoiceSection.querySelector('#invoice-date');
    dateInput.addEventListener('change', () => fetchInvoicesByDate(dateInput.value));

    const searchInput = cancelInvoiceSection.querySelector('#search-invoice-number');
    searchInput.addEventListener('input', debounce(async (e) => {
        const searchTerm = e.target.value.trim();
        const date = dateInput.value;
        const invoiceSelect = cancelInvoiceSection.querySelector('#invoice-select');
        invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';

        try {
            showLoading(cancelInvoiceSection.querySelector('.invoice-details'), true);
            const response = await fetch(`/api/facturacion?search=${encodeURIComponent(searchTerm)}&startDate=${date}&endDate=${date}`);
            if (!response.ok) throw new Error('Failed to search invoices');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid invoice data format');
            invoiceSelect.innerHTML = '<option value="">Seleccione una factura</option>';
            if (invoices.length === 0) {
                alert('No se encontraron facturas con el número ingresado.');
            } else {
                invoices.forEach(invoice => {
                    const option = document.createElement('option');
                    option.value = invoice.id;
                    option.textContent = `${invoice.numero} - ${new Date(invoice.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}`;
                    invoiceSelect.appendChild(option);
                });
            }
        } catch (error) {
            alert('Error al buscar facturas: ' + error.message);
            invoiceSelect.innerHTML = '<option value="">Error al cargar</option>';
        } finally {
            showLoading(cancelInvoiceSection.querySelector('.invoice-details'), false);
        }
    }, 300));

    cancelInvoiceSection.querySelector('#invoice-select').addEventListener('change', (e) => {
        const invoiceId = e.target.value;
        if (invoiceId) {
            fetchInvoiceDetails(invoiceId);
        } else {
            resetSection();
        }
    });

    cancelInvoiceSection.querySelector('.btn-back-to-billing').addEventListener('click', () => {
        loadBillingSection();
    });

    cancelInvoiceSection.querySelector('.btn-cancel-invoice').addEventListener('click', async () => {
        const invoiceId = cancelInvoiceSection.querySelector('#invoice-select').value;
        if (!invoiceId) {
            alert('Por favor, seleccione una factura para cancelar.');
            return;
        }

        if (!confirm('¿Está seguro de que desea cancelar esta factura? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            showLoading(cancelInvoiceSection.querySelector('.invoice-products'), true);
            const response = await fetch('/api/cancelar-factura', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ factura_id: invoiceId })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al cancelar la factura');

            alert('Factura cancelada exitosamente.');
            resetSection(); // Reiniciar la sección después de cancelar
            fetchInvoicesByDate(dateInput.value); // Recargar las facturas disponibles
        } catch (error) {
            alert('Error al cancelar la factura: ' + error.message);
        } finally {
            showLoading(cancelInvoiceSection.querySelector('.invoice-products'), false);
        }
    });
}

// =================================
// Sección de Gestión (Conocer Ingresos, Facturas realizadas, Realizar consultas de precio de facturación, Exportar datos, etc)
// =================================

async function loadManagementSection() {
    window.scrollTo(0, 0);

    mainContent.innerHTML = `
<div class="management-section">
    <div class="management-header">
        <h1>Panel de Gestión</h1>
        <p>Analiza tus ventas, facturas y exporta datos para tu negocio</p>
    </div>

    <div class="management-options">
        <button id="btn-conocer-datos">Conocer Datos</button>
        <button id="btn-exportar-datos">Exportar Datos</button>
        <button id="btn-rentabilidad-productos">Rentabilidad de Productos</button>
    </div>

    <div class="quick-stats">
        <h2>Estadísticas Rápidas</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Ingresos del Día</h3>
                <p id="daily-income">Cargando...</p>
            </div>
            <div class="stat-card">
                <h3>Ingresos del Mes</h3>
                <p id="monthly-income">Cargando...</p>
            </div>
            <div class="stat-card">
                <h3>Ingresos del Año</h3>
                <p id="yearly-income">Cargando...</p>
            </div>
            <div class="stat-card">
                <h3>Producto Más Vendido</h3>
                <p id="best-seller">Cargando...</p>
            </div>
            <div class="stat-card">
                <h3>Facturas Total Emitidas</h3>
                <p id="invoices-issued">Cargando...</p>
            </div>
            <div class="stat-card">
                <h3>Facturas Total Canceladas</h3>
                <p id="invoices-canceled">Cargando...</p>
            </div>
            <div class="stat-card">
                <h3>Medio de Pago Más Usado</h3>
                <p id="top-payment-method">Cargando...</p>
            </div>
        </div>
    </div>

    <div class="quick-alerts">
        <h2>Alertas de Negocio</h2>
        <ul id="alerts-list">
            <li>Cargando alertas...</li>
        </ul>
    </div>

    <div class="trends-chart">
        <h2>Tendencias de Ventas</h2>
        <div class="chart-container">
            <canvas id="sales-trend-chart"></canvas>
        </div>
    </div>
    `;

    // Ejecutar funciones de carga en paralelo pero de forma independiente
    Promise.allSettled([
        loadQuickStats(),
        loadBusinessAlerts(),
        loadSalesTrendChart()
    ]).then((results) => {
        console.log('Resultados de carga:', results);
    });

    document.getElementById('btn-conocer-datos').addEventListener('click', () => {
        loadDataInsightsSection();
    });
    document.getElementById('btn-exportar-datos').addEventListener('click', () => {
      openExportModal();
    });
    document.getElementById('btn-rentabilidad-productos').addEventListener('click', () => {
      loadProductProfitabilitySection()
    });

}

async function loadSalesTrendChart() {
    try {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) chartContainer.innerHTML = '<div class="chart-loading">📊 Cargando gráfica de tendencias...</div>';

        const response = await fetch('/api/gestion/tendencias-ventas');
        if (!response.ok) throw new Error('Error al cargar datos de tendencias de ventas');
        const data = await response.json();
        console.log('Datos de tendencias:', data); // Depuración

        if (chartContainer) chartContainer.innerHTML = '<canvas id="sales-trend-chart"></canvas>';

        const { initSalesTrendChart } = await import('/utils/grafics.js');
        initSalesTrendChart(data.todayVsYesterday, data.currentVsPreviousMonth);
    } catch (error) {
        console.error('Error loading sales trend chart:', error);
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) chartContainer.innerHTML = '<div class="chart-error">❌ Error al cargar la gráfica de tendencias</div>';
    }
}

async function loadQuickStats() {
    try {
        const response = await fetch('/api/gestion/estadisticas-rapidas');
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        const data = await response.json();
        console.log('Datos de estadísticas:', data); // Depuración
        document.getElementById('daily-income').textContent = data.dailyIncome;
        document.getElementById('monthly-income').textContent = data.monthlyIncome;
        document.getElementById('yearly-income').textContent = data.yearlyIncome;
        document.getElementById('best-seller').textContent = data.bestSeller;
        document.getElementById('invoices-issued').textContent = data.invoicesIssued;
        document.getElementById('invoices-canceled').textContent = data.invoicesCanceled;
        document.getElementById('top-payment-method').textContent = data.topPaymentMethod;
    } catch (error) {
        console.error('Error loading quick stats:', error);
        document.getElementById('daily-income').textContent = 'Error al cargar';
        document.getElementById('monthly-income').textContent = 'Error al cargar';
        document.getElementById('yearly-income').textContent = 'Error al cargar';
        document.getElementById('best-seller').textContent = 'Error al cargar';
        document.getElementById('invoices-issued').textContent = 'Error al cargar';
        document.getElementById('invoices-canceled').textContent = 'Error al cargar';
        document.getElementById('top-payment-method').textContent = 'Error al cargar';
    }
}

async function loadBusinessAlerts() {
    try {
        const response = await fetch('/api/gestion/alertas-negocio');
        
        if (!response.ok) {
            throw new Error('Error al cargar alertas');
        }
        
        const alerts = await response.json();
        const alertsList = document.getElementById('alerts-list');
        
        // Limpiar lista existente
        alertsList.innerHTML = '';
        
        if (alerts.length === 0) {
            alertsList.innerHTML = '<li>✅ No hay productos con stock bajo (menos de 5 unidades)</li>';
        } else {
            alerts.forEach(alert => {
                const listItem = document.createElement('li');
                listItem.textContent = alert.message;
                
                // Agregar clase CSS según la cantidad para diferentes niveles de alerta
                if (alert.quantity <= 2) {
                    listItem.className = 'alert-critical';
                } else if (alert.quantity <= 4) {
                    listItem.className = 'alert-warning';
                }
                
                alertsList.appendChild(listItem);
            });
        }
        
    } catch (error) {
        console.error('Error loading business alerts:', error);
        document.getElementById('alerts-list').innerHTML = '<li>❌ Error al cargar alertas</li>';
    }
}

// Conocer Datos
async function loadDataInsightsSection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`; // June 3, 2025

    // Función para formatear fecha en español
    const formatDateToSpanish = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} de ${month} de ${year}`;
    };

    const searchInvoiceSection = document.createElement('div');
    searchInvoiceSection.classList.add('search-invoice-section');
    searchInvoiceSection.innerHTML = `
        <div class="invoice-header">
            <h1>Conocer Datos</h1>
            <div class="invoice-details">
                <input type="date" id="invoice-date" value="${currentDate}" max="${currentDate}">
                <div id="calendar-container"></div>
            </div>
        </div>
        <div class="DATOS_SISTEMA_wrapper">
            <div class="DATOS_SISTEMA_header">
                <h2 id="selected-date-title">Información del día ${formatDateToSpanish(currentDate)}</h2>
                <div class="DATOS_SISTEMA_summary">
                    <div class="DATOS_SISTEMA_card DATOS_SISTEMA_total-insights">
                        <span class="DATOS_SISTEMA_icon">📊</span>
                        <div class="DATOS_SISTEMA_info">
                            <h3>Total Facturas</h3>
                            <p id="total-invoices">Cargando...</p>
                        </div>
                    </div>
                    <div class="DATOS_SISTEMA_card DATOS_SISTEMA_income-insights">
                        <span class="DATOS_SISTEMA_icon">💵</span>
                        <div class="DATOS_SISTEMA_info">
                            <h3>Ingresos Totales</h3>
                            <p id="total-income">Cargando...</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="DATOS_SISTEMA_grid">
                <div class="DATOS_SISTEMA_card">
                    <h3><span class="DATOS_SISTEMA_icon">❌</span> Facturas Rechazadas</h3>
                    <p id="rejected-invoices">Cargando...</p>
                </div>
                <div class="DATOS_SISTEMA_card">
                    <h3><span class="DATOS_SISTEMA_icon">📦</span> Productos Vendidos</h3>
                    <p id="total-products-sold">Cargando...</p>
                </div>
                <div class="DATOS_SISTEMA_card">
                    <h3><span class="DATOS_SISTEMA_icon">🏆</span> Producto Más Vendido</h3>
                    <p id="top-sold-product">Cargando...</p>
                </div>
                <div class="DATOS_SISTEMA_card">
                    <h3><span class="DATOS_SISTEMA_icon">💳</span> Ingresos por Transferencia</h3>
                    <p id="income-transfer">Cargando...</p>
                </div>
                <div class="DATOS_SISTEMA_card">
                    <h3><span class="DATOS_SISTEMA_icon">💵</span> Ingresos por Efectivo</h3>
                    <p id="income-cash">Cargando...</p>
                </div>
            </div>

            </div>
        </div>
        <button class="btn-back-to-billing">Regresar al Menú de Gestión</button>
    `;

    mainContent.appendChild(searchInvoiceSection);

    const formatPrice = (value) => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(numericValue)) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numericValue).replace('COP', '').trim();
    };

    const fetchInvoiceDates = async () => {
        try {
            const response = await fetch('/api/facturacion?startDate=2000-01-01');
            const invoices = await response.json();
            if (!Array.isArray(invoices)) throw new Error('Invalid response format');
            const invoiceDates = [...new Set(invoices.map(invoice => 
                new Date(invoice.fecha).toISOString().split('T')[0]
            ))];
            return invoiceDates;
        } catch (error) {
            alert('Error al cargar fechas de facturas: ' + error.message);
            return [];
        }
    };

    const initializeCalendar = async () => {
        const invoiceDates = await fetchInvoiceDates();
        const dateInput = searchInvoiceSection.querySelector('#invoice-date');
        const calendarContainer = searchInvoiceSection.querySelector('#calendar-container');

        const calendar = document.createElement('div');
        calendar.classList.add('calendar');
        calendarContainer.appendChild(calendar);

        const updateCalendar = (selectedDate) => {
            const date = new Date(selectedDate);
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const lastDay = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
            const todayDate = today.getDate();

            calendar.innerHTML = `
                <div class="calendar-header">
                    <button id="prev-month" ${month === 0 ? 'disabled' : ''}><</button>
                    <span>${date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}</span>
                    <button id="next-month" ${isCurrentMonth ? 'disabled' : ''}>></button>
                </div>
                <div class="calendar-grid">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                    ${Array.from({ length: firstDay }, () => '<div></div>').join('')}
                    ${Array.from({ length: lastDay }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isEnabled = invoiceDates.includes(dateStr);
                        const isToday = isCurrentMonth && day === todayDate;
                        return `<div class="calendar-day ${isEnabled ? 'has-invoice' : 'disabled'} ${isToday ? 'today' : ''}" data-date="${dateStr}">${day}</div>`;
                    }).join('')}
                </div>
            `;

            calendar.querySelectorAll('.calendar-day.has-invoice').forEach(day => {
                day.addEventListener('click', () => {
                    dateInput.value = day.dataset.date;
                    updateSelectedDateTitle(day.dataset.date);
                    fetchDataInsights(day.dataset.date);
                    calendar.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    day.classList.add('selected');
                });
            });

            calendar.querySelector('#prev-month')?.addEventListener('click', () => {
                date.setMonth(date.getMonth() - 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });

            calendar.querySelector('#next-month')?.addEventListener('click', () => {
                if (isCurrentMonth) return;
                date.setMonth(date.getMonth() + 1);
                updateCalendar(date.toISOString().split('T')[0]);
            });
        };

        updateCalendar(dateInput.value);
    };

    // Función para actualizar el título de la fecha
    const updateSelectedDateTitle = (dateString) => {
        const titleElement = document.getElementById('selected-date-title');
        titleElement.textContent = `Información del día ${formatDateToSpanish(dateString)}`;
    };

    const fetchDataInsights = async (date) => {
        try {
            const response = await fetch(`/api/gestion/datos-dia?date=${date}`);
            if (!response.ok) throw new Error('Error al cargar datos del día');
            const data = await response.json();

            document.getElementById('total-invoices').textContent = data.totalInvoices || '0';
            document.getElementById('rejected-invoices').textContent = data.rejectedInvoices || '0';
            document.getElementById('total-products-sold').textContent = data.totalProductsSold || '0';
            document.getElementById('top-sold-product').textContent = data.topSoldProduct || 'Sin datos';
            document.getElementById('income-transfer').textContent = formatPrice(data.incomeTransfer || 0);
            document.getElementById('income-cash').textContent = formatPrice(data.incomeCash || 0);
            // Calcular ingresos totales (suma de transferencia y efectivo)
            const totalIncome = (parseFloat(data.incomeTransfer) || 0) + (parseFloat(data.incomeCash) || 0);
            document.getElementById('total-income').textContent = formatPrice(totalIncome);
        } catch (error) {
            alert('Error al cargar datos: ' + error.message);
            document.getElementById('total-invoices').textContent = 'Error';
            document.getElementById('rejected-invoices').textContent = 'Error';
            document.getElementById('total-products-sold').textContent = 'Error';
            document.getElementById('top-sold-product').textContent = 'Error';
            document.getElementById('income-transfer').textContent = 'Error';
            document.getElementById('income-cash').textContent = 'Error';
            document.getElementById('total-income').textContent = 'Error';
        }
    };

    initializeCalendar();
    fetchDataInsights(currentDate);

    const dateInput = searchInvoiceSection.querySelector('#invoice-date');
    dateInput.addEventListener('change', () => {
        updateSelectedDateTitle(dateInput.value);
        fetchDataInsights(dateInput.value);
    });

    searchInvoiceSection.querySelector('.btn-back-to-billing').addEventListener('click', () => {
        loadManagementSection();
    });
}

// Exportar Datos
async function openExportModal() {
    // Crear el modal dinámicamente
    const modal = document.createElement('div');
    modal.id = 'export-modal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5);';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:#fff; margin:10% auto; padding:20px; width:400px; border-radius:8px;';
    
    modalContent.innerHTML = `
        <h2>Exportar Datos</h2>
        <label>Seleccione qué exportar:</label>
        <select id="export-type">
            <option value="productos">Productos</option>
            <option value="facturas">Facturas</option>
            <option value="entrada_mercancia">Entrada de Mercancía</option>
            <option value="salida_mercancia">Salida de Mercancía</option>
            <option value="devoluciones">Devoluciones</option>
            <option value="todos">Todos</option>
        </select>
        
        <div id="period-select" style="display:none;">
            <label>Período:</label>
            <select id="export-period">
                <option value="dia">Día</option>
                <option value="mes">Mes</option>
                <option value="ano">Año</option>
            </select>
        </div>
        
        <label>Tipo de archivo:</label>
        <select id="export-format">
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
        </select>
        
        <button id="export-confirm">Exportar</button>
        <button id="export-cancel">Cancelar</button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Mostrar el modal
    modal.style.display = 'block';

    // Manejo del tipo de exportación
    const exportTypeSelect = document.getElementById('export-type');
    const periodSelect = document.getElementById('period-select');
    exportTypeSelect.addEventListener('change', (e) => {
        // Mostrar el selector de período solo para facturas, entrada_mercancia, salida_mercancia y devoluciones
        if (['facturas', 'entrada_mercancia', 'salida_mercancia', 'devoluciones'].includes(e.target.value)) {
            periodSelect.style.display = 'block';
        } else {
            periodSelect.style.display = 'none';
        }
    });

    // Confirmar exportación
    document.getElementById('export-confirm').addEventListener('click', async () => {
        const exportType = exportTypeSelect.value;
        const exportFormat = document.getElementById('export-format').value;
        // Usar period solo si no es "todos"
        const period = exportType === 'todos' ? null : document.getElementById('export-period')?.value || 'dia';

        let data;
        try {
            switch (exportType) {
                case 'productos':
                    const productosResponse = await fetch(`/api/gestion/exportar-productos${period ? `?period=${period}` : ''}`);
                    if (!productosResponse.ok) throw new Error(`Error al obtener productos: ${productosResponse.statusText}`);
                    data = await productosResponse.json();
                    break;
                case 'facturas':
                    const facturasResponse = await fetch(`/api/gestion/exportar-facturas?period=${period}`);
                    if (!facturasResponse.ok) throw new Error(`Error al obtener facturas: ${facturasResponse.statusText}`);
                    data = await facturasResponse.json();
                    break;
                case 'entrada_mercancia':
                    const entradaResponse = await fetch(`/api/gestion/exportar-entrada-mercancia?period=${period}`);
                    if (!entradaResponse.ok) throw new Error(`Error al obtener entrada de mercancía: ${entradaResponse.statusText}`);
                    data = await entradaResponse.json();
                    break;
                case 'salida_mercancia':
                    const salidaResponse = await fetch(`/api/gestion/exportar-salida-mercancia?period=${period}`);
                    if (!salidaResponse.ok) throw new Error(`Error al obtener salida de mercancía: ${salidaResponse.statusText}`);
                    data = await salidaResponse.json();
                    break;
                case 'devoluciones':
                    const devolucionesResponse = await fetch(`/api/gestion/exportar-devoluciones?period=${period}`);
                    if (!devolucionesResponse.ok) throw new Error(`Error al obtener devoluciones: ${devolucionesResponse.statusText}`);
                    data = await devolucionesResponse.json();
                    break;
                case 'todos':
                    // Usar una sola ruta para obtener todos los datos
                    const response = await fetch(`/api/gestion/exportar-todos`);
                    if (!response.ok) throw new Error(`Error al obtener todos los datos: ${response.statusText}`);
                    data = await response.json();
                    break;
                default:
                    throw new Error('Tipo de exportación no válido');
            }

            // Validar que tenemos datos
            if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
                alert('No hay datos para exportar');
                return;
            }

            // Enviar los datos al backend para generar el archivo
            const response = await fetch('/api/gestion/exportar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, exportType, period: period || 'todos', format: exportFormat })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error desconocido');
            
            alert(result.message);
            
        } catch (error) {
            console.error('Error exporting data:', error);
            alert(`Error al exportar los datos: ${error.message}`);
        }
        
        modal.style.display = 'none';
        document.body.removeChild(modal);
    });

    // Cancelar exportación
    document.getElementById('export-cancel').addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    });
}

// Rentabilidad de los productos
async function loadProductProfitabilitySection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    const profitabilitySection = document.createElement('div');
    profitabilitySection.classList.add('profitability-section');
    profitabilitySection.innerHTML = `
        <div class="profitability-header">
            <h1>Rentabilidad de Productos</h1>
        </div>
        
        <div class="product-calculator">
            <div class="product-name-section">
                <h3>Nombre del Producto</h3>
                <input type="text" id="product-name" placeholder="Ej: Postre de Leche">
            </div>

            <div class="ingredients-section">
                <h3>Ingredientes</h3>
                <div class="ingredient-form">
                    <input type="text" id="ingredient-name" placeholder="Nombre del ingrediente">
                    <input type="number" id="ingredient-total-amount" placeholder="Cantidad total comprada" step="0.01">
                    <input type="number" id="ingredient-total-price" placeholder="Precio total pagado" step="0.01">
                    <input type="number" id="ingredient-used-amount" placeholder="Cantidad usada" step="0.01">
                    <select id="ingredient-unit">
                        <option value="gramos">Gramos</option>
                        <option value="ml">Mililitros</option>
                        <option value="litros">Litros</option>
                        <option value="kg">Kilogramos</option>
                        <option value="unidades">Unidades</option>
                    </select>
                    <button type="button" id="add-ingredient">Agregar Ingrediente</button>
                </div>
                <div id="ingredients-list"></div>
            </div>

            <div class="packaging-section">
                <h3>Empaquetado</h3>
                <div class="packaging-form">
                    <input type="text" id="packaging-name" placeholder="Nombre del empaque">
                    <input type="number" id="packaging-total-quantity" placeholder="Cantidad total comprada" step="1">
                    <input type="number" id="packaging-total-price" placeholder="Precio total pagado" step="0.01">
                    <input type="number" id="packaging-used-quantity" placeholder="Cantidad usada" step="1">
                    <button type="button" id="add-packaging">Agregar Empaque</button>
                </div>
                <div id="packaging-list"></div>
            </div>

            <div class="additional-costs-section">
                <h3>Costos Adicionales</h3>
                <div class="additional-cost-form">
                    <input type="text" id="additional-cost-name" placeholder="Nombre del costo adicional">
                    <input type="number" id="additional-cost-amount" placeholder="Costo" step="0.01">
                    <button type="button" id="add-additional-cost">Agregar Costo</button>
                </div>
                <div id="additional-costs-list"></div>
            </div>

            <div class="production-calculation">
                <h3>Cálculo de Producción</h3>
                <div class="production-form">
                    <label>Cantidad a producir:</label>
                    <input type="number" id="production-quantity" placeholder="Cantidad de unidades" step="1" min="1" value="1">
                    <label>Margen de ganancia (%):</label>
                    <input type="number" id="profit-margin" placeholder="Porcentaje de ganancia" step="0.1" min="0" value="30">
                </div>
            </div>

            <div class="results-section">
                <h3>Resultados</h3>
                <div id="calculation-results"></div>
            </div>
        </div>

        <button class="btn-back-to-billing">Regresar al Menú de Gestión</button>
    `;

    mainContent.appendChild(profitabilitySection);

    // Variables para almacenar los datos
    let ingredients = [];
    let packaging = [];
    let additionalCosts = [];

    // Función para formatear precios
    const formatPrice = (value) => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(numericValue)) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numericValue).replace('COP', '').trim();
    };

    // Función para calcular el costo de un ingrediente
    const calculateIngredientCost = (totalAmount, totalPrice, usedAmount) => {
        const pricePerUnit = totalPrice / totalAmount;
        return pricePerUnit * usedAmount;
    };

    // Función para calcular el costo de empaque
    const calculatePackagingCost = (totalQuantity, totalPrice, usedQuantity) => {
        const pricePerUnit = totalPrice / totalQuantity;
        return pricePerUnit * usedQuantity;
    };

    // Función para renderizar la lista de ingredientes
    const renderIngredientsList = () => {
        const ingredientsList = document.getElementById('ingredients-list');
        ingredientsList.innerHTML = ingredients.map((ingredient, index) => {
            const cost = calculateIngredientCost(ingredient.totalAmount, ingredient.totalPrice, ingredient.usedAmount);
            return `
                <div class="ingredient-item">
                    <span><strong>${ingredient.name}</strong> - ${ingredient.usedAmount} ${ingredient.unit} de ${ingredient.totalAmount} ${ingredient.unit} (${formatPrice(cost)})</span>
                    <button type="button" onclick="removeIngredient(${index})">Eliminar</button>
                </div>
            `;
        }).join('');
    };

    // Función para renderizar la lista de empaques
    const renderPackagingList = () => {
        const packagingList = document.getElementById('packaging-list');
        packagingList.innerHTML = packaging.map((pack, index) => {
            const cost = calculatePackagingCost(pack.totalQuantity, pack.totalPrice, pack.usedQuantity);
            return `
                <div class="packaging-item">
                    <span><strong>${pack.name}</strong> - ${pack.usedQuantity} unidades de ${pack.totalQuantity} (${formatPrice(cost)})</span>
                    <button type="button" onclick="removePackaging(${index})">Eliminar</button>
                </div>
            `;
        }).join('');
    };

    // Función para renderizar costos adicionales
    const renderAdditionalCostsList = () => {
        const additionalCostsList = document.getElementById('additional-costs-list');
        additionalCostsList.innerHTML = additionalCosts.map((cost, index) => `
            <div class="additional-cost-item">
                <span><strong>${cost.name}</strong> - ${formatPrice(cost.amount)}</span>
                <button type="button" onclick="removeAdditionalCost(${index})">Eliminar</button>
            </div>
        `).join('');
    };

    // Función para calcular y mostrar resultados
    const calculateResults = () => {
        const productName = document.getElementById('product-name').value;
        const productionQuantity = parseInt(document.getElementById('production-quantity').value) || 1;
        const profitMargin = parseFloat(document.getElementById('profit-margin').value) || 0;

        // Calcular costo total de ingredientes
        const totalIngredientsCost = ingredients.reduce((sum, ingredient) => {
            return sum + calculateIngredientCost(ingredient.totalAmount, ingredient.totalPrice, ingredient.usedAmount);
        }, 0);

        // Calcular costo total de empaque
        const totalPackagingCost = packaging.reduce((sum, pack) => {
            return sum + calculatePackagingCost(pack.totalQuantity, pack.totalPrice, pack.usedQuantity);
        }, 0);

        // Calcular costo total adicional
        const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);

        // Costo total por unidad
        const totalCostPerUnit = totalIngredientsCost + totalPackagingCost + totalAdditionalCosts;

        // Costo total para la cantidad a producir
        const totalProductionCost = totalCostPerUnit * productionQuantity;

        // Precio de venta por unidad (con margen de ganancia)
        const sellingPricePerUnit = totalCostPerUnit * (1 + profitMargin / 100);

        // Ingresos totales
        const totalRevenue = sellingPricePerUnit * productionQuantity;

        // Ganancia total
        const totalProfit = totalRevenue - totalProductionCost;

        // Mostrar resultados
        const resultsDiv = document.getElementById('calculation-results');
        resultsDiv.innerHTML = `
            <div class="results-summary">
                <h4>Resumen para: ${productName || 'Producto sin nombre'}</h4>
                
                <div class="cost-breakdown">
                    <h5>Desglose de Costos por Unidad:</h5>
                    <p>• Ingredientes: ${formatPrice(totalIngredientsCost)}</p>
                    <p>• Empaquetado: ${formatPrice(totalPackagingCost)}</p>
                    <p>• Costos adicionales: ${formatPrice(totalAdditionalCosts)}</p>
                    <p><strong>Total costo por unidad: ${formatPrice(totalCostPerUnit)}</strong></p>
                </div>

                <div class="production-summary">
                    <h5>Producción de ${productionQuantity} unidad(es):</h5>
                    <p>• Costo total de producción: ${formatPrice(totalProductionCost)}</p>
                    <p>• Precio de venta por unidad (${profitMargin}% ganancia): ${formatPrice(sellingPricePerUnit)}</p>
                    <p>• Ingresos totales: ${formatPrice(totalRevenue)}</p>
                    <p><strong>Ganancia total: ${formatPrice(totalProfit)}</strong></p>
                </div>

                ${totalCostPerUnit > 0 ? `
                <div class="profitability-analysis">
                    <h5>Análisis de Rentabilidad:</h5>
                    <p>• Margen de ganancia por unidad: ${formatPrice(sellingPricePerUnit - totalCostPerUnit)}</p>
                    <p>• ROI (Retorno de inversión): ${((totalProfit / totalProductionCost) * 100).toFixed(2)}%</p>
                </div>
                ` : ''}
            </div>
        `;
    };

    // Funciones globales para eliminar elementos
    window.removeIngredient = (index) => {
        ingredients.splice(index, 1);
        renderIngredientsList();
        calculateResults();
    };

    window.removePackaging = (index) => {
        packaging.splice(index, 1);
        renderPackagingList();
        calculateResults();
    };

    window.removeAdditionalCost = (index) => {
        additionalCosts.splice(index, 1);
        renderAdditionalCostsList();
        calculateResults();
    };

    // Event listeners
    document.getElementById('add-ingredient').addEventListener('click', () => {
        const name = document.getElementById('ingredient-name').value;
        const totalAmount = parseFloat(document.getElementById('ingredient-total-amount').value);
        const totalPrice = parseFloat(document.getElementById('ingredient-total-price').value);
        const usedAmount = parseFloat(document.getElementById('ingredient-used-amount').value);
        const unit = document.getElementById('ingredient-unit').value;

        if (name && totalAmount && totalPrice && usedAmount) {
            ingredients.push({ name, totalAmount, totalPrice, usedAmount, unit });
            renderIngredientsList();
            calculateResults();
            
            // Limpiar campos
            document.getElementById('ingredient-name').value = '';
            document.getElementById('ingredient-total-amount').value = '';
            document.getElementById('ingredient-total-price').value = '';
            document.getElementById('ingredient-used-amount').value = '';
        } else {
            alert('Por favor, complete todos los campos del ingrediente');
        }
    });

    document.getElementById('add-packaging').addEventListener('click', () => {
        const name = document.getElementById('packaging-name').value;
        const totalQuantity = parseInt(document.getElementById('packaging-total-quantity').value);
        const totalPrice = parseFloat(document.getElementById('packaging-total-price').value);
        const usedQuantity = parseInt(document.getElementById('packaging-used-quantity').value);

        if (name && totalQuantity && totalPrice && usedQuantity) {
            packaging.push({ name, totalQuantity, totalPrice, usedQuantity });
            renderPackagingList();
            calculateResults();
            
            // Limpiar campos
            document.getElementById('packaging-name').value = '';
            document.getElementById('packaging-total-quantity').value = '';
            document.getElementById('packaging-total-price').value = '';
            document.getElementById('packaging-used-quantity').value = '';
        } else {
            alert('Por favor, complete todos los campos del empaque');
        }
    });

    document.getElementById('add-additional-cost').addEventListener('click', () => {
        const name = document.getElementById('additional-cost-name').value;
        const amount = parseFloat(document.getElementById('additional-cost-amount').value);

        if (name && amount) {
            additionalCosts.push({ name, amount });
            renderAdditionalCostsList();
            calculateResults();
            
            // Limpiar campos
            document.getElementById('additional-cost-name').value = '';
            document.getElementById('additional-cost-amount').value = '';
        } else {
            alert('Por favor, complete todos los campos del costo adicional');
        }
    });

    // Event listeners para actualizar cálculos en tiempo real
    document.getElementById('production-quantity').addEventListener('input', calculateResults);
    document.getElementById('profit-margin').addEventListener('input', calculateResults);
    document.getElementById('product-name').addEventListener('input', calculateResults);

    // Botón de regreso
    profitabilitySection.querySelector('.btn-back-to-billing').addEventListener('click', () => {
        loadManagementSection();
    });

    // Cálculo inicial
    calculateResults();
}

// =================================
// Sección de Ayuda (Gestión de ayuda para usar la plataforma)
// =================================

async function loadHelpSection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = `
      <div class="help-section">
        <div class="welcome-section">
          <h1>Centro de Ayuda</h1>
          <p>Encuentra guías y soporte para gestionar tu sistema de facturación de manera eficiente.</p>
        </div>
        <div class="help-content">
          <h2>Guía del Sistema</h2>
          <p>Bienvenido al Centro de Ayuda de tu sistema de facturación. Aquí encontrarás información detallada sobre cómo utilizar las cuatro secciones principales: Productos, Inventario, Facturas y Gestión.</p>

          <h3>1. Productos</h3>
          <p>La sección de <strong>Productos</strong> te permite administrar tu catálogo de manera eficiente. Puedes:</p>
          <ul>
            <li><strong>Filtrar productos</strong> por nombre, código, categoría, proveedor o estado (activo/inactivo).</li>
            <li><strong>Crear un producto</strong> ingresando su nombre, categoría, proveedor (opcional), precio, cantidad disponible y fecha de registro. El sistema genera automáticamente un código único basado en la categoría para agilizar la gestión.</li>
            <li><strong>Editar o desactivar productos</strong>. Los productos desactivados no aparecen en el inventario ni en las facturas, pero se conservan en el sistema para futuras reactivaciones, evitando problemas con facturas anteriores.</li>
            <li><strong>Agregar categorías y proveedores</strong>. Para categorías, solo se requiere el nombre. Para proveedores, el nombre es obligatorio y el contacto es opcional.</li>
          </ul>
          <p><strong>Nota:</strong> El sistema formatea automáticamente los precios (por ejemplo, 15000 se muestra como 15.000 y viceversa). Los productos activos son los únicos disponibles para inventario y ventas.</p>

          <h3>2. Inventario</h3>
          <p>En la sección de <strong>Inventario</strong>, solo se muestran los productos activos. Puedes:</p>
          <ul>
            <li><strong>Agregar unidades</strong> especificando la cantidad, el proveedor y la fecha de ingreso.</li>
            <li><strong>Descontar unidades</strong> en caso de productos dañados, indicando la cantidad a retirar.</li>
          </ul>
          <p>Las actualizaciones se reflejan en tiempo real. Un producto con 0 unidades no puede usarse en facturas ni descontarse hasta que se reponga el inventario.</p>

          <h3>3. Facturas</h3>
          <p>La sección de <strong>Facturas</strong> te permite gestionar todo el proceso de facturación:</p>
          <ul>
            <li><strong>Crear facturas:</strong>
              <ul>
                <li>Facturas nuevas (NUV) o antiguas (ANT) se identifican automáticamente según la fecha seleccionada. Si eliges un día anterior al actual (hoy: 5/06/2025), el sistema marca la factura como antigua y ajusta el número de factura.</li>
                <li>Agrega productos buscando por código o categoría. Se muestran los productos disponibles con su nombre, cantidad disponible, cantidad a vender y precio unitario (editable).</li>
                <li>Edita cantidades y precios en tiempo real, aplica descuentos al total o elimina productos de la factura.</li>
                <li>Selecciona medios de pago (efectivo, transferencia o ambos). El botón de finalizar se habilita solo cuando el pago está completo.</li>
                <li>Registra un cliente (nombre, teléfono único, correo opcional) o usa "N/A" para un cliente por defecto. La factura puede enviarse por correo (nota: la facturación electrónica con la DIAN está en fase beta).</li>
              </ul>
            </li>
            <li><strong>Buscar facturas:</strong> Filtra por fecha para ver las facturas de un día específico. Puedes reimprimir facturas, registrar un cliente si faltan datos o ver los productos incluidos.</li>
            <li><strong>Devolver unidades:</strong> Busca la factura, selecciona el producto dañado, registra la observación y devuelve las unidades al inventario.</li>
            <li><strong>Cancelar facturas:</strong> Cancela una factura si se emitió por error. La factura se marca como "Cancelada" en el sistema.</li>
            <li><strong>Resumen diario:</strong> Muestra facturas generadas, productos vendidos e ingresos del día.</li>
          </ul>

          <h3>4. Gestión</h3>
          <p>La sección de <strong>Gestión</strong> ofrece un resumen detallado del rendimiento diario, mensual y anual:</p>
          <ul>
            <li><strong>Estadísticas rápidas:</strong>
              <ul>
                <li>Total de facturas emitidas y canceladas.</li>
                <li>Ingresos por día, mes y año.</li>
                <li>Producto más vendido.</li>
                <li>Medio de pago más usado (efectivo o transferencia).</li>
              </ul>
            </li>
            <li><strong>Alertas de negocio:</strong> Notifica productos con 5 o menos unidades en inventario.</li>
            <li><strong>Tendencias de ventas:</strong> Compara las ventas de hoy con ayer y el rendimiento del mes actual con el anterior.</li>
            <li><strong>Exportación de datos:</strong> Exporta productos, facturas, entradas/salidas de mercancía y devoluciones en formato Excel o PDF, por día, mes, año o todo el registro.</li>
            <li><strong>Rentabilidad de productos:</strong> Calcula el costo de producción para productos elaborados (por ejemplo, dulces), ayudando a analizar su rentabilidad.</li>
          </ul>

          <h3>Información Adicional</h3>
          <p>El sistema está desarrollado con JavaScript puro y usa Node.js como servidor. Se ejecuta mediante un archivo .EXE o CMD, que debe permanecer activo para que el sistema funcione. Puedes usarlo en red local o remota, siendo la red remota ideal para gestionar desde múltiples dispositivos (teléfonos o computadoras). Si el CMD o .EXE se cierra, el sistema queda inactivo hasta que se reinicie.</p>
          <p>Para más detalles o soporte, consulta las secciones específicas o contacta al equipo de desarrollo.</p>
        </div>
      </div>
    `;
}

  // =================================
  // Sección de Cerrar Sesión
  // =================================
async function handleLogout() {
    const confirmed = await showConfirmModal('¿Estás seguro de que quieres cerrar sesión?');
    if (confirmed) {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                window.location.href = '/';
            } else {
                console.error('Error logging out');
                alert('Error al cerrar sesión');
                // Regresar al dashboard en caso de error
                const dashboardLink = document.querySelector('.nav-menu a[href="#dashboard"]');
                if (dashboardLink) {
                    dashboardLink.click();
                }
            }
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Error al cerrar sesión');
            // Regresar al dashboard en caso de excepción
            const dashboardLink = document.querySelector('.nav-menu a[href="#dashboard"]');
            if (dashboardLink) {
                dashboardLink.click();
            }
        }
    } else {
        // Si el usuario selecciona "No", recargar el dashboard
        const dashboardLink = document.querySelector('.nav-menu a[href="#dashboard"]');
        if (dashboardLink) {
            dashboardLink.click();
        }
    }
}

// =================================
// Sección de Dashboard
// =================================

async function loadDashboardSection() {
    window.scrollTo(0, 0);
    mainContent.innerHTML = `
      <div class="welcome-section">
        <h1>¡Bienvenido a tu Sistema de Facturación!</h1>
        <p>Gestiona tu tienda de manera eficiente y profesional</p>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="card-icon">📦</div>
          <h3>Productos</h3>
          <p>Gestiona tu catálogo de productos</p>
          <button class="btn-primary" data-section="productos">Ver Productos</button>
        </div>
        <div class="dashboard-card">
          <div class="card-icon">📊</div>
          <h3>Inventario</h3>
          <p>Controla tu stock en tiempo real</p>
          <button class="btn-primary" data-section="inventario">Ver Inventario</button>
        </div>
        <div class="dashboard-card">
          <div class="card-icon">🧾</div>
          <h3>Facturas</h3>
          <p>Crea y gestiona tus facturas</p>
          <button class="btn-primary" data-section="facturas">Nueva Factura</button>
        </div>
        <div class="dashboard-card">
          <div class="card-icon">📈</div>
          <h3>Reportes</h3>
          <p>Analiza tus ventas y tendencias</p>
          <button class="btn-primary" data-section="gestion">Ver Reportes</button>
        </div>
      </div>
    `;

    // Add event listeners for dashboard buttons
    document.querySelectorAll('.dashboard-card .btn-primary').forEach(button => {
      button.addEventListener('click', () => {
        const section = button.getAttribute('data-section');
        const link = document.querySelector(`.nav-menu a[href="#${section}"]`);
        if (link) {
          link.click();
        }
      });
    });
}

// =================================
// Navigation Handler
// =================================

navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const section = link.getAttribute('href').substring(1);
      mainContent.innerHTML = '';

      // Highlight active link
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      switch (section) {
        case 'dashboard':
          await loadDashboardSection();
          break;
        case 'productos':
          await loadProductsSection();
          break;
        case 'inventario':
          await loadInventorySection();
          break;
        case 'facturas':
          await loadBillingSection();
          break;
        case 'gestion':
          await loadManagementSection();
          break;
        case 'ayuda':
          await loadHelpSection();
          break;
        case 'salir':
          await handleLogout();
          break;
        default:
          await loadDashboardSection();
      }
    });
});


// Load dashboard by default
const dashboardLink = document.querySelector('.nav-menu a[href="#dashboard"]');
  if (dashboardLink) {
    dashboardLink.click();
}

});