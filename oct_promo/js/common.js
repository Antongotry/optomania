function getURLVar(key) {
    var value = [];

    var query = String(document.location).split('?');

    if (query[1]) {
        var part = query[1].split('&');

        for (i = 0; i < part.length; i++) {
            var data = part[i].split('=');

            if (data[0] && data[1]) {
                value[data[0]] = data[1];
            }
        }

        if (value[key]) {
            return value[key];
        } else {
            return '';
        }
    }
}

$(document).ready(function () {

    $('.text-danger').each(function () {
        var element = $(this).parent().parent();

        if (element.hasClass('form-group')) {
            element.addClass('has-error');
        }
    });

    $('body').on('click', '#form-currency .currency-select', function (e) {
        e.preventDefault();

        $('#form-currency input[name=\'code\']').val($(this).attr('name'));

        $('#form-currency').submit();
    });

    $('body').on('click', '#form-language .language-select', function (e) {
        e.preventDefault();

        $('#form-language input[name=\'code\']').val($(this).attr('name'));

        $('#form-language').submit();
    });

    /* Search */
    $('#search input[name=\'search\']').parent().find('#pr-search-button').on('click', function () {
        var url = $('base').attr('href') + 'index.php?route=product/search';

        var value = $('#search input[name=\'search\']').val();

        if (value.length > 0) {
            url += '&search=' + encodeURIComponent(value);
            location = url;
        }

    });

    $('#search input[name=\'search\']').on('keydown', function (e) {
        if (e.keyCode == 13) {
            $('#search input[name=\'search\']').parent().find('#pr-search-button').trigger('click');
        }
    });

    const searchForm = document.getElementById('search');
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    /* Blog Search */
    $('#oct-blog-search-button').on('click', function () {
        var url = $('base').attr('href') + 'index.php?route=octemplates/blog/oct_blogsearch';

        var value = $('#blog_search input[name=\'blog_search\']').val();

        if (value.length > 0) {
            url += '&search=' + encodeURIComponent(value);
            location = url;
        }

    });

    $('#blog_search input[name=\'blog_search\']').on('keydown', function (e) {
        if (e.keyCode == 13) {
            $('#oct-blog-search-button').trigger('click');
        }
    });

    $('#menu .dropdown-menu').each(function () {
        var menu = $('#menu').offset();
        var dropdown = $(this).parent().offset();

        var i = (dropdown.left + $(this).outerWidth()) - (menu.left + $('#menu').outerWidth());

        if (i > 0) {
            $(this).css('margin-left', '-' + (i + 10) + 'px');
        }
    });

    $("#grid-view, #list-view").mouseleave(function () {
        $('[data-toggle="tooltip"]').tooltip("hide");
    });

    $(document).on('keydown', '#collapse-checkout-option input[name=\'email\'], #collapse-checkout-option input[name=\'password\']', function (e) {
        if (e.keyCode == 13) {
            $('#collapse-checkout-option #button-login').trigger('click');
        }
    });

    $('[data-toggle=\'tooltip\']').tooltip({
        container: 'body',
        boundary: 'window'
    });

    $(document).ajaxStop(function () {
        $('[data-toggle=\'tooltip\']').tooltip({
            container: 'body',
            boundary: 'window'
        });
    });
});

var cart = {
    'add': function (product_id, quantity, page = 0, clickedButton = 0) {
        $.ajax({
            url: 'index.php?route=checkout/cart/add',
            type: 'post',
            data: 'product_id=' + product_id + '&quantity=' + (typeof (quantity) != 'undefined' ? quantity : 1),
            dataType: 'json',
            cache: false,
            beforeSend: function () {
                $('#cart > button').button('loading');

                if (clickedButton) {
                    $(clickedButton).data('original-content', $(clickedButton).html());
                    $(clickedButton).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>').prop('disabled', true);
                }
            },
            complete: function () {
                $('#cart > button').button('reset');

                if (clickedButton) {
                    setTimeout(function () {
                        $(clickedButton).html('<i class="fas fa-check fsz-16"></i>').prop('disabled', true);
                    }, 1000);

                    setTimeout(function () {
                        $(clickedButton).html($(clickedButton).data('original-content')).prop('disabled', false);
                        
                        if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
                            const input = clickedButton.querySelector('input[name="product_id"]');
                            const productId = input ? input.value : null;
                            
                            if (productId && window.interactiveButtonsManager.cartIds.has(String(productId))) {
                                window.interactiveButtonsManager.updateButtonState(clickedButton, 'cart', true);
                            }
                        }
                    }, 1200);
                }
            },
            success: function (json) {
                $('.alert-dismissible, .text-danger').remove();

                if (page == 1 && json['error']) {
                    const headerHeight = document.querySelector('header').offsetHeight,
                        productID = document.getElementById('oct-product-id'),
                        productIDToCompare = parseInt(product_id);

                    if (productID) {
                        const tabsHeight = document.getElementById('oct-tabs').offsetHeight,
                            productIDValue = parseInt(productID.value);

                        if (document.body.getAttribute("data-popup-options")) {
                            octPopupProductOptions(product_id);
                            return;
                        } else if (productIDValue === productIDToCompare) {
                            scrollToElement('.pr-product-actions-middle', null, -headerHeight - tabsHeight - 42);
                            return;
                        }
                    }
                }

                if (json['redirect']) {
                    if (document.body.getAttribute("data-popup-options")) {
                        octPopupProductOptions(product_id);

                    } else {
                        location = json['redirect'];
                    }
                }

                if (json['error'] && json['error']['error_warning']) {
                    prNotify('danger', '<div class="alert-text-item">' + json['error']['error_warning'] + '</div>');
                }

                if (json['success']) {
                    if (json['isPopup']) {
                        octSidebarCart();
                    } else {
                        prNotify('success', json['success']);
                    }

                    let cartIdsHolder = document.querySelector("[data-cart-ids]");
                    
                    if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
                        window.interactiveButtonsManager.add(product_id, 'cart');
                        
                        if (cartIdsHolder && !json['oct_cart_ids']) {
                            const currentIds = cartIdsHolder.dataset.cartIds ? cartIdsHolder.dataset.cartIds.split(',').filter(id => id) : [];
                            if (!currentIds.includes(String(product_id))) {
                                currentIds.push(String(product_id));
                                cartIdsHolder.dataset.cartIds = currentIds.join(',');
                            }
                        }
                        
                        if (clickedButton) {
                            setTimeout(() => {
                                const buttonTextElement = clickedButton.querySelector('.button-text');
                                if (buttonTextElement) {
                                    window.interactiveButtonsManager.updateButtonState(clickedButton, 'cart', true);
                                }
                            }, 1300);
                        }
                    }

                    setTimeout(function () {
                        $('.pr-header-buttons-item-count-cart').addClass('active').html(json['total_products']);
                    }, 100);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
            }
        });
    },
    'update': function (key, quantity) {
        $.ajax({
            url: 'index.php?route=checkout/cart/edit',
            type: 'post',
            data: 'key=' + key + '&quantity=' + (typeof (quantity) != 'undefined' ? quantity : 1),
            dataType: 'json',
            cache: false,
            beforeSend: function () {
                $('#cart > button').button('loading');
            },
            complete: function () {
                $('#cart > button').button('reset');
            },
            success: function (json) {
                setTimeout(function () {
                    $('.pr-header-buttons-item-count-cart').html(json['total_products']);
                    $('.rm-header-cart-text').html(json['total_amount']);
                }, 100);

                var now_location = String(document.location.pathname);

                if ((now_location == '/cart/') || (now_location == '/cart') || (now_location == '/checkout/') || (now_location == '/checkout') || (getURLVar('route') == 'checkout/cart') || (getURLVar('route') == 'checkout/checkout')) {
                    location = 'index.php?route=checkout/cart';
                } else {
                    $('#cart > ul').load('index.php?route=common/cart/info ul li');
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
            }
        });
    },
    'remove': function (key, clickedButton = null) {
        let productId = null;
        if (clickedButton && clickedButton.dataset && clickedButton.dataset.productId) {
            productId = clickedButton.dataset.productId;
        }
        
        
        $.ajax({
            url: 'index.php?route=checkout/cart/remove',
            type: 'post',
            data: 'key=' + key,
            dataType: 'json',
            cache: false,
            beforeSend: function () {
                $('#cart > button').button('loading');
            },
            complete: function () {
                $('#cart > button').button('reset');
            },
            success: function (json) {
                
                let cartIdsHolder = document.querySelector("[data-cart-ids]");

                if (json.oct_cart_ids && json.oct_cart_ids.length > 0 && cartIdsHolder) {
                    cartIdsHolder.dataset.cartIds = json.oct_cart_ids;
                } else if (cartIdsHolder) {
                    cartIdsHolder.dataset.cartIds = '';
                }

                const removedProductId = json.removed_product_id || productId;
                
                
                if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized && removedProductId) {
                    window.interactiveButtonsManager.remove(removedProductId, 'cart');
                }

                if (json['total_products'] > 0) {
                    $('.pr-header-buttons-item-count-cart').removeClass('active');
                }

                setTimeout(function () {
                    $('.pr-header-buttons-item-count-cart').html(json['total_products']);
                }, 100);

                var now_location = String(document.location.pathname);

                if ((now_location == '/cart/') || (now_location == '/cart') || (now_location == '/checkout/') || (now_location == '/checkout') || (getURLVar('route') == 'checkout/cart') || (getURLVar('route') == 'checkout/checkout')) {
                    setTimeout(function() {
                        location = 'index.php?route=checkout/cart';
                    }, 200);
                } else {
                    $('#cart > ul').load('index.php?route=common/cart/info ul li');
                }
            }
        });
    }
}

var voucher = {
    'add': function () {

    },
    'remove': function (key) {
        $.ajax({
            url: 'index.php?route=checkout/cart/remove',
            type: 'post',
            data: 'key=' + key,
            dataType: 'json',
            cache: false,
            beforeSend: function () {
                $('#cart > button').button('loading');
            },
            complete: function () {
                $('#cart > button').button('reset');
            },
            success: function (json) {
                setTimeout(function () {
                    $('.pr-header-buttons-item-count-cart').html(json['total_products']);
                }, 100);

                var now_location = String(document.location.pathname);

                if ((now_location == '/cart/') || (now_location == '/cart') || (now_location == '/checkout/') || (now_location == '/checkout') || (getURLVar('route') == 'checkout/cart') || (getURLVar('route') == 'checkout/checkout')) {
                    location = 'index.php?route=checkout/cart';
                } else {
                    $('#cart > ul').load('index.php?route=common/cart/info ul li');
                }

                const cartModal = document.getElementById('cartModal');

                if (cartModal) {
                    $('#cartModal').modal('hide');
                    octSidebarCart();

                    setTimeout(function () {
                        $('#cartModal').modal('show');
                    }, 500);

                    return;
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {

            }
        });
    }
}

var wishlist = {
    'add': function (product_id) {
        if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
            if (window.interactiveButtonsManager.wishlistIds.has(String(product_id))) {
                wishlist.remove(product_id);
                return;
            }
        }
        
        $.ajax({
            url: 'index.php?route=account/wishlist/add',
            type: 'post',
            data: 'product_id=' + product_id,
            dataType: 'json',
            cache: false,
            success: function (json) {
                $('.alert-dismissible').remove();

                if (json['redirect']) {
                    location = json['redirect'];
                }

                if (json['success']) {
                    prNotify('success', json['success']);
                    $('.pr-header-buttons-item-wishlist .pr-header-buttons-item-count, .pr-mobile-bottom-nav-item-wishlist .pr-mobile-bottom-nav-item-badge, .pr-header-buttons-item-count-wishlist').html(json['total_wishlist']);
                    
                    if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
                        window.interactiveButtonsManager.add(product_id, 'wishlist');
                    }
                }
            }
        });
    },
    'remove': function (product_id) {
        $.ajax({
            url: 'index.php?route=octemplates/events/helper/wishlistRemove',
            type: 'post',
            data: 'product_id=' + product_id,
            dataType: 'json',
            cache: false,
            success: function (json) {
                if (json['success']) {
                    prNotify('success', json['success']);
                    $('.pr-header-buttons-item-wishlist .pr-header-buttons-item-count, .pr-mobile-bottom-nav-item-wishlist .pr-mobile-bottom-nav-item-badge, .pr-header-buttons-item-count-wishlist').html(json['total_wishlist']);
                    
                    if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
                        window.interactiveButtonsManager.remove(product_id, 'wishlist');
                    }
                }
            }
        });
    }
}

var compare = {
    'add': function (product_id) {
        if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
            if (window.interactiveButtonsManager.compareIds.has(String(product_id))) {
                compare.remove(product_id);
                return;
            }
        }
        
        $.ajax({
            url: 'index.php?route=product/compare/add',
            type: 'post',
            data: 'product_id=' + product_id,
            dataType: 'json',
            cache: false,
            success: function (json) {
                $('.alert-dismissible').remove();

                if (json['success']) {
                    prNotify('success', json['success']);
                    $('.pr-header-buttons-item-compare .pr-header-buttons-item-count, .pr-mobile-bottom-nav-item-compare .pr-mobile-bottom-nav-item-badge, .pr-header-buttons-item-count-compare').html(json['total_compare']);
                    
                    if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
                        window.interactiveButtonsManager.add(product_id, 'compare');
                    }
                }
            }
        });
    },
    'remove': function (product_id) {
        $.ajax({
            url: 'index.php?route=octemplates/events/helper/compareRemove',
            type: 'post',
            data: 'product_id=' + product_id,
            dataType: 'json',
            cache: false,
            success: function (json) {
                if (json['success']) {
                    prNotify('success', json['success']);
                    $('.pr-header-buttons-item-compare .pr-header-buttons-item-count, .pr-mobile-bottom-nav-item-compare .pr-mobile-bottom-nav-item-badge, .pr-header-buttons-item-count-compare').html(json['total_compare']);
                    
                    if (window.interactiveButtonsManager && window.interactiveButtonsManager.initialized) {
                        window.interactiveButtonsManager.remove(product_id, 'compare');
                    }
                }
            }
        });
    }
}

/* Agree to Terms */
$(document).delegate('.agree', 'click', function (e) {
    e.preventDefault();
    masked('body', true);
    $('#modal-agree').remove();

    let element = this,
        link = '';
    let r = $(element).data('rel');

    if (r && r != 'undefined') {
        link = 'index.php?route=information/information/agree&information_id=' + r;
    } else {
        link = $(element).attr('href');
    }

    $.ajax({
        url: link,
        type: 'get',
        dataType: 'html',
        cache: false,
        success: function (data) {
            let html;
            
            html = '<div class="modal fade" id="modal-agree" tabindex="-1" role="dialog" aria-labelledby="modal-agree" aria-hidden="true">';
            html += '  <div class="modal-dialog modal-dialog-centered wide">';
            html += '    <div class="modal-content">';
            html += '      <div class="modal-header p-4 bg-grey">';
            html += '        <h5 class="modal-title fsz-20 fw-700 d-flex align-items-center justify-content-between dark-text">' + $(element).text() + '</h5>';
            html += '        <button type="button" class="btn-close br-8 bg-white" data-bs-dismiss="modal" aria-label="Close"></button>';
            html += '      </div>';
            html += '      <div class="modal-body modal-body-agree p-4 dark-text modal-body-popup-text fsz-16">' + data + '</div>';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';

            $('body').append(html);
            masked('body', false);
            $('#modal-agree').modal('show');
        }
    });
});

/**
 * InteractiveButtonsManager - Manages wishlist, compare, and cart button states
 */
class InteractiveButtonsManager {
    constructor() {
        this.wishlistIds = new Set();
        this.compareIds = new Set();
        this.cartIds = new Set();
        this.observer = null;
        this.observedElements = new WeakSet();
        this.dataHolders = {
            wishlist: null,
            compare: null,
            cart: null
        };
        this.textCache = {
            wishlist: { default: '', added: '' },
            compare: { default: '', added: '' },
            cart: { default: '', added: '' }
        };
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        this.loadIdsFromDOM();
        this.loadTextValues();
        this.setupObserver();
        this.observeAllProducts();
        
        this.initialized = true;
    }

    loadIdsFromDOM() {
        const wishlistHolder = document.querySelector('[data-wishlist-ids]');
        if (wishlistHolder) {
            this.dataHolders.wishlist = wishlistHolder;
            const ids = wishlistHolder.dataset.wishlistIds;
            if (ids) {
                ids.split(',').forEach(id => {
                    const trimmedId = id.trim();
                    if (trimmedId) this.wishlistIds.add(trimmedId);
                });
            }
        }

        const compareHolder = document.querySelector('[data-compare-ids]');
        if (compareHolder) {
            this.dataHolders.compare = compareHolder;
            const ids = compareHolder.dataset.compareIds;
            if (ids) {
                ids.split(',').forEach(id => {
                    const trimmedId = id.trim();
                    if (trimmedId) this.compareIds.add(trimmedId);
                });
            }
        }

        const cartHolder = document.querySelector('[data-cart-ids]');
        if (cartHolder) {
            this.dataHolders.cart = cartHolder;
            const ids = cartHolder.dataset.cartIds;
            if (ids) {
                ids.split(',').forEach(id => {
                    const trimmedId = id.trim();
                    if (trimmedId) this.cartIds.add(trimmedId);
                });
            }
        }
    }

    loadTextValues() {
        if (this.dataHolders.wishlist) {
            this.textCache.wishlist.default = this.dataHolders.wishlist.dataset.wishlistText || '';
            this.textCache.wishlist.added = this.dataHolders.wishlist.dataset.wishlistTextIn || '';
        }

        if (this.dataHolders.compare) {
            this.textCache.compare.default = this.dataHolders.compare.dataset.compareText || '';
            this.textCache.compare.added = this.dataHolders.compare.dataset.compareTextIn || '';
        }

        let cartHolder = document.querySelector('[data-cart-text]');
        if (!cartHolder) {
            cartHolder = document.querySelector('.button-cart');
        }
        if (cartHolder) {
            this.textCache.cart.default = cartHolder.dataset.cartText || '';
            this.textCache.cart.added = cartHolder.dataset.cartTextIn || '';
        }
    }

    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.observedElements.has(entry.target)) {
                    this.checkProductButtons(entry.target);
                    this.observedElements.add(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.01
        });
    }

    observeAllProducts() {
        const productContainers = document.querySelectorAll('.pr-module-item, .content-block');
        
        productContainers.forEach(container => {
            if (!this.observedElements.has(container)) {
                this.observer.observe(container);
                
                const rect = container.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                if (isVisible) {
                    this.checkProductButtons(container);
                    this.observedElements.add(container);
                }
            }
        });
        
        if (this.cartIds.size > 0) {
            this.cartIds.forEach(productId => {
                this.updateAllButtonsForProduct(productId, 'cart', true);
            });
        }
        
        const productPageBtn = document.querySelector('#button-cart[data-product-id]');
        if (productPageBtn) {
            const productId = productPageBtn.dataset.productId;
            if (this.cartIds.has(productId)) {
                this.updateButtonState(productPageBtn, 'cart', true);
            }
        }
    }
    checkProductButtons(container) {
        let productId = null;
        
        const productIdElement = container.querySelector('[data-product-id]');
        if (productIdElement) {
            productId = productIdElement.dataset.productId;
        }
        
        if (!productId) {
            const wishlistBtn = container.querySelector('[onclick*="wishlist.add"]');
            if (wishlistBtn) {
                const match = wishlistBtn.getAttribute('onclick').match(/wishlist\.add\('(\d+)'\)/);
                if (match) productId = match[1];
            }
        }

        if (!productId) return;

        if (this.wishlistIds.has(productId)) {
            const wishlistBtns = container.querySelectorAll('[onclick*="wishlist.add"]');
            wishlistBtns.forEach(btn => {
                this.updateButtonState(btn, 'wishlist', true);
            });
        }

        if (this.compareIds.has(productId)) {
            const compareBtns = container.querySelectorAll('[onclick*="compare.add"]');
            compareBtns.forEach(btn => {
                this.updateButtonState(btn, 'compare', true);
            });
        }

        if (this.cartIds.has(productId)) {
            const cartButtons = container.querySelectorAll('.button-cart');
            const matchingCartBtns = Array.from(cartButtons).filter(btn => {
                const input = btn.querySelector('input[name="product_id"]');
                return input && input.value === String(productId);
            });
            
            matchingCartBtns.forEach(btn => {
                this.updateButtonState(btn, 'cart', true);
            });

            const fixedCartBtns = container.querySelectorAll('.pr-product-fixed-cart-btn');
            const matchingFixedBtns = Array.from(fixedCartBtns).filter(btn => {
                if (btn.dataset.productId === String(productId)) return true;
                const input = btn.querySelector('input[name="product_id"]');
                return input && input.value === String(productId);
            });
            
            matchingFixedBtns.forEach(btn => {
                this.updateButtonState(btn, 'cart', true);
            });
            
            const productPageBtn = container.querySelector('#button-cart[data-product-id]');
            if (productPageBtn && productPageBtn.dataset.productId === String(productId)) {
                this.updateButtonState(productPageBtn, 'cart', true);
            }
            
            const oldCartBtns = container.querySelectorAll('[onclick*="cart.add"]');
            oldCartBtns.forEach(btn => {
                this.updateButtonState(btn, 'cart', true);
            });
        }
    }

    /**
     * Update button state (add/remove 'added' class and update text)
     */
    updateButtonState(button, type, isAdded) {
        if (!button) return;

        if (isAdded) {
            button.classList.add('added');
            const buttonText = button.querySelector('.button-text');
            if (buttonText) {
                const addedText = button.dataset.addedText || this.textCache[type]?.added;
                if (addedText) {
                    buttonText.textContent = addedText;
                }
            }
        } else {
            button.classList.remove('added');
            const buttonText = button.querySelector('.button-text');
            if (buttonText) {
                const defaultText = button.dataset.addText || this.textCache[type]?.default;
                if (defaultText) {
                    buttonText.textContent = defaultText;
                }
            }
        }
    }

    add(productId, type) {
        productId = String(productId);
        let idsSet, dataHolder, dataAttr;
        
        switch(type) {
            case 'wishlist':
                idsSet = this.wishlistIds;
                dataHolder = this.dataHolders.wishlist;
                dataAttr = 'wishlistIds';
                break;
            case 'compare':
                idsSet = this.compareIds;
                dataHolder = this.dataHolders.compare;
                dataAttr = 'compareIds';
                break;
            case 'cart':
                idsSet = this.cartIds;
                dataHolder = this.dataHolders.cart;
                dataAttr = 'cartIds';
                break;
            default:
                return;
        }

        idsSet.add(productId);
        if (dataHolder) {
            dataHolder.dataset[dataAttr] = Array.from(idsSet).join(',');
        }
        this.updateAllButtonsForProduct(productId, type, true);
    }

    remove(productId, type) {
        productId = String(productId);
        let idsSet, dataHolder, dataAttr;
        
        switch(type) {
            case 'wishlist':
                idsSet = this.wishlistIds;
                dataHolder = this.dataHolders.wishlist;
                dataAttr = 'wishlistIds';
                break;
            case 'compare':
                idsSet = this.compareIds;
                dataHolder = this.dataHolders.compare;
                dataAttr = 'compareIds';
                break;
            case 'cart':
                idsSet = this.cartIds;
                dataHolder = this.dataHolders.cart;
                dataAttr = 'cartIds';
                break;
            default:
                return;
        }

        idsSet.delete(productId);
        if (dataHolder) {
            dataHolder.dataset[dataAttr] = Array.from(idsSet).join(',');
        }
        
        this.updateAllButtonsForProduct(productId, type, false);
    }

    updateAllButtonsForProduct(productId, type, isAdded) {
        let buttons = [];
        
        
        switch(type) {
            case 'wishlist':
                buttons = document.querySelectorAll(`[onclick*="wishlist.add('${productId}')"]`);
                break;
            case 'compare':
                buttons = document.querySelectorAll(`[onclick*="compare.add('${productId}')"]`);
                break;
            case 'cart':
                const allCartButtons = document.querySelectorAll('.button-cart');
                buttons = Array.from(allCartButtons).filter(btn => {
                    const input = btn.querySelector('input[name="product_id"]');
                    return input && input.value === String(productId);
                });

                const fixedCartBtns = document.querySelectorAll('.pr-product-fixed-cart-btn');
                const matchingFixedBtns = Array.from(fixedCartBtns).filter(btn => {
                    if (btn.dataset.productId === String(productId)) return true;
                    const input = btn.querySelector('input[name="product_id"]');
                    return input && input.value === String(productId);
                });
                buttons = [...buttons, ...matchingFixedBtns];
                
                const productPageBtn = document.querySelector('#button-cart[data-product-id]');
                if (productPageBtn && productPageBtn.dataset.productId === String(productId)) {
                    buttons = [...buttons, productPageBtn];
                }
                
                const popupViewBtn = document.querySelector('#oct-popup-button-cart[data-product-id]');
                if (popupViewBtn && popupViewBtn.dataset.productId === String(productId)) {
                    buttons = [...buttons, popupViewBtn];
                }
                
                const oldStyleButtons = document.querySelectorAll(`[onclick*="cart.add('${productId}"]`);
                buttons = [...buttons, ...oldStyleButtons];
                break;
            default:
                return;
        }

        buttons.forEach((btn, index) => {
            this.updateButtonState(btn, type, isAdded);
        });
    }

    /**
     * Re-observe new products added dynamically (e.g., via AJAX)
     * Call this after loading new products
     */
    refreshObserver() {
        this.observeAllProducts();
    }
}

window.interactiveButtonsManager = new InteractiveButtonsManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.interactiveButtonsManager.init();
    });
} else {
    window.interactiveButtonsManager.init();
}

(function ($) {
    $.fn.autocomplete = function (option) {
        return this.each(function () {
            this.timer = null;
            this.items = new Array();

            $.extend(this, option);

            $(this).attr('autocomplete', 'off');

            $(this).on('focus', function () {
                this.request();
            });

            $(this).on('blur', function () {
                setTimeout(function (object) {
                    object.hide();
                }, 200, this);
            });

            $(this).on('keydown', function (event) {
                switch (event.keyCode) {
                    case 27: // escape
                        this.hide();
                        break;
                    default:
                        this.request();
                        break;
                }
            });

            this.click = function (event) {
                event.preventDefault();

                value = $(event.target).parent().attr('data-value');

                if (value && this.items[value]) {
                    this.select(this.items[value]);
                }
            }

            this.show = function () {
                var pos = $(this).position();

                $(this).siblings('ul.dropdown-menu').css({
                    top: pos.top + $(this).outerHeight(),
                    left: pos.left
                });

                $(this).siblings('ul.dropdown-menu').show();
            }

            this.hide = function () {
                $(this).siblings('ul.dropdown-menu').hide();
            }

            this.request = function () {
                clearTimeout(this.timer);

                this.timer = setTimeout(function (object) {
                    object.source($(object).val(), $.proxy(object.response, object));
                }, 200, this);
            }

            this.response = function (json) {
                html = '';

                if (json.length) {
                    for (i = 0; i < json.length; i++) {
                        this.items[json[i]['value']] = json[i];
                    }

                    for (i = 0; i < json.length; i++) {
                        if (!json[i]['category']) {
                            html += '<li data-value="' + json[i]['value'] + '"><a href="#">' + json[i]['label'] + '</a></li>';
                        }
                    }

                    var category = new Array();

                    for (i = 0; i < json.length; i++) {
                        if (json[i]['category']) {
                            if (!category[json[i]['category']]) {
                                category[json[i]['category']] = new Array();
                                category[json[i]['category']]['name'] = json[i]['category'];
                                category[json[i]['category']]['item'] = new Array();
                            }

                            category[json[i]['category']]['item'].push(json[i]);
                        }
                    }

                    for (i in category) {
                        html += '<li class="dropdown-header">' + category[i]['name'] + '</li>';

                        for (j = 0; j < category[i]['item'].length; j++) {
                            html += '<li data-value="' + category[i]['item'][j]['value'] + '"><a href="#">&nbsp;&nbsp;&nbsp;' + category[i]['item'][j]['label'] + '</a></li>';
                        }
                    }
                }

                if (html) {
                    this.show();
                } else {
                    this.hide();
                }

                $(this).siblings('ul.dropdown-menu').html(html);
            }

            $(this).after('<ul class="dropdown-menu"></ul>');
            $(this).siblings('ul.dropdown-menu').delegate('a', 'click', $.proxy(this.click, this));

        });
    }
})(window.jQuery);