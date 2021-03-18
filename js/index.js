  function onResize() {
    // resize the canvas container to as big as possible, preserving squareness
    var winWidth = window.innerWidth;
    var winHeight = window.innerHeight;
    var dim = winWidth;
    if (dim > winHeight)
    {
      dim = winHeight;

      // account for the header above the pizza image 
      var header = document.getElementById('header');
      if (header != null && header != undefined)
      {
        var bounds = header.getBoundingClientRect();
        dim -= (bounds.height);
      }
    }
    document.getElementById("pizza_container").style.width = dim + "px";
    document.getElementById("pizza_container").style.height = dim + "px";            
  }

  function onLoad() {
    onResize();
    showLoader(false);

    var canvas = document.getElementById('canvas');
    dim = 800;
    canvas.width = dim;
    canvas.height = dim;
  }

  var globalTextureDictionary = new Map();
  var displayBundle;
  var texturesToLoad = 0;

  function showLoader(viz) {
    var loader = document.getElementById("loader");
    var pizza_container = document.getElementById("pizza_container");       
    if (viz == true)
    {
      loader.style.display = "block";  
      pizza_container.style.display = "none";
    } 
    else
    {
      loader.style.display = "none"; 
      pizza_container.style.display = "block";
    }  
  }


  function loadTextures(textureList) {
      // Load the textures
      //textureList.forEach(loadTexture);

      for (var i = 0; i < textureList.length; i++)
      {
          // check global cache first it might already be loaded
          var cachedImage = globalTextureDictionary.get(textureList[i]);
          if (cachedImage == undefined || cachedImage == null)
          {
              // kick off a load
              var img = new Image();
              texturesToLoad++;
              img.onload = onImageDoneLoad;
              img.src = textureList[i];
          }        
      }
  }

  function onImageDoneLoad() {
      //console.log("loaded " + this.src  + " with img = " + this);
      globalTextureDictionary.set(this.src, this);
      texturesToLoad--;

      renderWhenReady();
  }

  function renderWhenReady() {

      if (texturesToLoad == 0)
          render(displayBundle);
  }

  // HACK! move all this to classes, etc.
  var animate = false;
  function enableAnimation(val) {
    animate = val;
  }

  var animTimer = null;
  var renderer = null;
  var currRenderObjIndex = 0;
  var gCurrAnimatingDisplayBundle = null;
  function render(displayBundle)
  {
    // FIRST, patch the display list with texture handles
    patchDisplayBundle(displayBundle, globalTextureDictionary);
    
    showLoader(false);

    var canvas = document.getElementById('canvas');

    // create renderer if not already created
    if (renderer == null)
    renderer = new CanvasRenderer();

    if (animate != undefined && animate != null && animate == true)
    {
      // animate the toppings popping on (later flying on!)

      // reset animation:
      // TODO: make this a class, etc.
      if (animTimer)
      {
        clearInterval(animTimer);
        animTimer = null;
      }
      currRenderObjIndex = 0;
      gCurrAnimatingDisplayBundle = displayBundle;

      renderer.clearCanvas(canvas);
      animTimer = setInterval(tickAnim, 10);
    }
    else
    {
      // RENDER IMMEDIATELY
      renderer.renderToCanvas(canvas, displayBundle);
    }
  }


  function tickAnim() {
    //console.log("render!");
    var canvas = document.getElementById('canvas');

    // render directly to canvas here
    renderer.renderObjToCanvas(canvas, displayBundle.displayList[currRenderObjIndex++], [canvas.width/2, canvas.height/2], 1);

    // now save this canvas off as our background

    // see if we are done
    if (currRenderObjIndex >= displayBundle.displayList.length)
    {
      clearInterval(animTimer);
      animTimer = null;
    }
  }

  function patchDisplayBundle(displayBundle, textureDictionary) {
    // iterate display list and add textureImg to each, via text dict lookup
    for (var i = 0; i < displayBundle.displayList.length; i++)
    {
        var renderObj = displayBundle.displayList[i];
        if (textureDictionary.has(displayBundle.textureList[renderObj.textureIndex]) == false)
          console.log("HEY WAIT! No img data for " + displayBundle.textureList[renderObj.textureIndex]);

        renderObj.textureImg = textureDictionary.get(displayBundle.textureList[renderObj.textureIndex]);
    }
  }

    function onClickMakePizza_Fetch() {
      showLoader(true);
      // HACK stop any anims here
      if (animTimer)
      {
        clearInterval(animTimer);
        animTimer = null;
      }

      // Hit the server
      var ep = "http://pizza.oxbone.com/";
      if (gConfig.pizzaEndpoint != null && gConfig.pizzaEndpoint != undefined)
        ep = gConfig.pizzaEndpoint;

      fetch(ep + "?seed=" + Date.now())
          .then(res => res.json())
          .then((out) => {
              // console.log('Output: ', out);
              document.getElementById('pizzaDNALabel').innerHTML = out.dna;
  
              // load textures
              displayBundle = out.displayBundle;
              loadTextures(displayBundle.textureList);

              // set the label to pizza description
              document.getElementById('pizzaDescriptionLabel').innerHTML = out.description;     

             // handle pizza probability
            // TODO: color if particularly rare!  
            var denom = Math.round(1.0 / out.pizzaProbability);
            document.getElementById('pizzaProbabilityLabel').innerHTML = "1 out of " + denom;   

      
              renderWhenReady();

      }).catch(err => console.error(err));
    }

    function onClickMakePizza(dna) {
      showLoader(true);
      // HACK stop any anims here
      if (animTimer)
      {
        clearInterval(animTimer);
        animTimer = null;
      }
      
      // First make pizza and generate display list
      var pizza = new Pizza();

      if (dna == null  || dna == undefined)
        pizza.makeRandom({}, KitchenData);
      else
        pizza.makeFromDna(dna);

      document.getElementById('pizzaDNALabel').innerHTML = pizza.dna;
  
      // generate display list
      displayBundle = generateDisplayList(pizza, KitchenData);

      // generate ingredients data
      var ingredientsData = pizza.generateIngredientsData(KitchenData);

      // calculate pizza probability
      var pizzaProbability = pizza.calculatePizzaProbability(ingredientsData);   
      // TODO: color if particularly rare!  
      var denom = Math.round(1.0 / pizzaProbability);
      document.getElementById('pizzaProbabilityLabel').innerHTML = "1 out of " + denom;   

      // set the label to pizza description
      var desc = pizza.generatePizzaDescription(ingredientsData);
      document.getElementById('pizzaDescriptionLabel').innerHTML = desc;     

      // load textures
      loadTextures(displayBundle.textureList);

      // render when ready
      renderWhenReady();
    }
