
  (function ($) {
  
  "use strict";

    // PRE LOADER
    $(window).load(function(){
      $('.preloader').delay(500).slideUp('slow'); // set duration in brackets    
    });

    // NAVBAR
    $(".navbar").headroom();

    $('.navbar-collapse a').click(function(){
        $(".navbar-collapse").collapse('hide');
    });

    $('.slick-slideshow').slick({
      autoplay: true,
      infinite: true,
      arrows: false,
      fade: true,
      dots: true,
    });

    $('.slick-testimonial').slick({
      arrows: false,
      dots: true,
    });
    
  })(window.jQuery);


  $(document).ready(function() {
    $('#checkout-btn').click(function() {
        window.location.href = 'checkout.html'; // Replace 'checkout-form.html' with your desired checkout form page
    });
});

$(document).ready(function() {
  $('#cart-btn').click(function() {
      var quantity = $('#inputGroupSelect01').val();
      if (quantity == 'Quantity') {
          alert('Veuillez selectionner une quantitée.');
      }
  });
  $('#checkout-btn').click(function() {
      var quantity = $('#inputGroupSelect01').val();
      if (quantity !== 'Quantity') {
          window.location.href = 'checkout.html'; // Replace 'checkout-form.html' with your desired checkout form page
      } else {
          alert('Veuillez selectionner une quantitée.');
      }
  });


  // Add your JavaScript code here
  // For example, to update the total price in the cart modal:
  $('#inputGroupSelect01').change(function() {
      var quantity = $(this).val();
      var price = 24.99; // Replace with the actual price of the product
      var totalPrice = quantity * price;
      $('.product-p strong span').text(totalPrice + '€');
  });
});
$(document).ready(function() {
  let selectedSize = '';
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  $('.size-btn').click(function() {
      $('.size-btn').removeClass('active');
      $(this).addClass('active');
      selectedSize = $(this).data('size');
  });

  $('#add-to-cart-btn').click(function() {
      if (!selectedSize) {
          alert('Please select a size');
          return;
      }

      // Récupère la quantité sélectionnée
      const selectedQuantity = parseInt($('#inputGroupSelect01').val());

      const product = {
          id: 1, // Remplacez par un ID unique si nécessaire
          name: 'T-shirt Unisex CLIMB (Noir)',
          price: 24.99,
          size: selectedSize,
          quantity: selectedQuantity // Utilise la quantité sélectionnée
      };

      // Vérifie si le produit existe déjà
      const existingProductIndex = cart.findIndex(item => 
          item.id === product.id && 
          item.size === product.size
      );

      if (existingProductIndex > -1) {
          // Met à jour la quantité si le produit existe
          cart[existingProductIndex].quantity += selectedQuantity;
      } else {
          // Ajoute le nouveau produit
          cart.push(product);
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      alert('Product added to cart');
  });

  function updateCartCount() {
      const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
      $('.bi-bag').attr('data-count', cartCount);
  }

  updateCartCount();
});

$(document).ready(function() {
  const mainProductThumb = $('#main-product-thumb');
  const mainProductImage = $('#main-product-image');
  const zoomPopup = $('#zoom-popup');
  const zoomedImage = $('#zoomed-image');

  let isMobile = window.matchMedia("(max-width: 768px)").matches;

  // Image Navigation
  let currentImageIndex = 0;
  const images = JSON.parse(mainProductImage.attr('data-images'));

  $('.nav-arrow').on('click', function(e) {
      e.stopPropagation(); // Prevent event bubbling
      
      currentImageIndex = $(this).hasClass('prev-arrow') 
          ? (currentImageIndex - 1 + images.length) % images.length
          : (currentImageIndex + 1) % images.length;
      
      mainProductImage.attr('src', images[currentImageIndex]);
      mainProductThumb.removeClass('zoomed');
  });

  // Desktop: Mouse-follow Zoom
  if (!isMobile) {
      mainProductThumb.on('mousemove', function(e) {
          if (mainProductThumb.hasClass('zoomed')) {
              const container = $(this);
              const img = mainProductImage;
              const containerWidth = container.width();
              const containerHeight = container.height();
              
              const posX = e.pageX - container.offset().left;
              const posY = e.pageY - container.offset().top;
              
              const x = (posX / containerWidth) * 100;
              const y = (posY / containerHeight) * 100;
              
              img.css('transform-origin', `${x}% ${y}%`);
              img.css('transform', 'scale(2)');
          }
      });

      mainProductThumb.on('mouseleave', function() {
          mainProductThumb.removeClass('zoomed');
          mainProductImage.css('transform', 'scale(1)');
      });

      mainProductThumb.on('click', function() {
          mainProductThumb.toggleClass('zoomed');
          if (!mainProductThumb.hasClass('zoomed')) {
              mainProductImage.css('transform', 'scale(1)');
          }
      });
  }

  // Mobile: Popup Zoom
  if (isMobile) {
      mainProductImage.on('click', function() {
          zoomedImage.attr('src', mainProductImage.attr('src'));
          zoomPopup.fadeIn();
      });

      // Close popup when clicking outside the image
      zoomPopup.on('click', function(e) {
          if (!$(e.target).closest('#zoomed-image').length) {
              zoomPopup.fadeOut();
          }
      });
  }

  // Prevent zoom on other product images
  $('.product-thumb').not('#main-product-thumb').off('hover');
  $('.product-image').not('#main-product-image').css('cursor', 'default');
// Initialize Hammer.js
var productThumb = document.getElementById('main-product-thumb');
var hammer = new Hammer(productThumb);

// Add swipe event listener
hammer.on('swipeleft', function(event) {
    var currentImageIndex = $('#main-product-image').data('current-image') || 0;
    var images = $('#main-product-image').data('images'); // Supprimer JSON.parse()

    if (currentImageIndex < images.length - 1) {
        currentImageIndex++;
        $('#main-product-image').attr('src', images[currentImageIndex]);
        $('#main-product-image').data('current-image', currentImageIndex);
    }
});

hammer.on('swiperight', function(event) {
    var currentImageIndex = $('#main-product-image').data('current-image') || 0;
    var images = $('#main-product-image').data('images'); // Supprimer JSON.parse()

    if (currentImageIndex > 0) {
        currentImageIndex--;
        $('#main-product-image').attr('src', images[currentImageIndex]);
        $('#main-product-image').data('current-image', currentImageIndex);
    }
});
});