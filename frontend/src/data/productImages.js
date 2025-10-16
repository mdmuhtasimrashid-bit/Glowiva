// Product Images Context - Sample skincare product images
// You can replace these URLs with your own product images

export const productImages = {
  // Cleansers
  cleansers: [
    {
      name: "Gentle Foaming Cleanser",
      url: "https://images.unsplash.com/photo-1556909110-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Gentle daily cleanser for all skin types"
    },
    {
      name: "Hydrating Cream Cleanser",
      url: "https://images.unsplash.com/photo-1556909043-f141df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "Rich cream cleanser for dry skin"
    },
    {
      name: "Purifying Gel Cleanser",
      url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Deep cleansing gel for oily skin"
    }
  ],

  // Moisturizers
  moisturizers: [
    {
      name: "Daily Hydrating Cream",
      url: "https://images.unsplash.com/photo-1556909143-f142df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "Lightweight daily moisturizer"
    },
    {
      name: "Intensive Night Cream",
      url: "https://images.unsplash.com/photo-1556909144-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Rich night cream for repair"
    },
    {
      name: "Oil-Free Moisturizer",
      url: "https://images.unsplash.com/photo-1556909145-f142df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "Non-greasy moisturizer for oily skin"
    }
  ],

  // Serums
  serums: [
    {
      name: "Vitamin C Serum",
      url: "https://images.unsplash.com/photo-1556909146-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Brightening vitamin C serum"
    },
    {
      name: "Hyaluronic Acid Serum",
      url: "https://images.unsplash.com/photo-1556909147-f142df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "Hydrating hyaluronic acid serum"
    },
    {
      name: "Retinol Serum",
      url: "https://images.unsplash.com/photo-1556909148-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Anti-aging retinol serum"
    }
  ],

  // Sunscreens
  sunscreens: [
    {
      name: "Daily SPF 30",
      url: "https://images.unsplash.com/photo-1556909149-f142df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "Lightweight daily sunscreen"
    },
    {
      name: "Mineral Sunscreen SPF 50",
      url: "https://images.unsplash.com/photo-1556909150-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Mineral-based sunscreen"
    }
  ],

  // Toners
  toners: [
    {
      name: "Balancing Toner",
      url: "https://images.unsplash.com/photo-1556909151-f142df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "pH balancing toner"
    },
    {
      name: "Exfoliating Toner",
      url: "https://images.unsplash.com/photo-1556909152-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Gentle exfoliating toner"
    }
  ],

  // Masks
  masks: [
    {
      name: "Hydrating Sheet Mask",
      url: "https://images.unsplash.com/photo-1556909153-f142df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "Moisturizing sheet mask"
    },
    {
      name: "Clay Purifying Mask",
      url: "https://images.unsplash.com/photo-1556909154-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Deep cleansing clay mask"
    }
  ],

  // Treatments
  treatments: [
    {
      name: "Acne Spot Treatment",
      url: "https://images.unsplash.com/photo-1556909155-f142df9e5525?w=400&h=400&fit=crop&crop=center",
      description: "Targeted acne treatment"
    },
    {
      name: "Eye Cream",
      url: "https://images.unsplash.com/photo-1556909156-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center",
      description: "Anti-aging eye cream"
    }
  ]
};

// Get all images as a flat array
export const getAllProductImages = () => {
  const allImages = [];
  Object.values(productImages).forEach(category => {
    allImages.push(...category);
  });
  return allImages;
};

// Get images by category
export const getImagesByCategory = (category) => {
  return productImages[category] || [];
};

// Search images by name
export const searchProductImages = (searchTerm) => {
  const allImages = getAllProductImages();
  return allImages.filter(image => 
    image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Default placeholder image
export const defaultProductImage = "https://images.unsplash.com/photo-1556909157-f142df9e5525?w=400&h=400&fit=crop&crop=center";