//关键字绘制参数
function createArtistsBubble(error, countries) {

  var populations = countries.map(function(country) { return +country.Weight; });
  var meanPopulation = d3.mean(populations),
      populationExtent = d3.extent(populations),
      populationScaleX,
      populationScaleY;

  var continents = d3.set(countries.map(function(country) { return country.Group_Code; }));
  var continentColorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(continents.values());

  var width = window.innerWidth,
      height = 800;
  var svg,
      circles,
      circleSize = { min: 10, max: 80 };
  var circleRadiusScale = d3.scaleSqrt()
    .domain(populationExtent)
    .range([circleSize.min, circleSize.max]);

  var forces,
      forceSimulation;

  createSVG();
  toggleContinentKey(!flagFill());
  createCircles();
  createForces();
  createForceSimulation();
  addFlagDefinitions();
  addFillListener();    

  function createSVG() {
    svg = d3.select("#bubble-chart")
      .append("svg")
        .attr("width", width)
        .attr("height", height);
  }

  function toggleContinentKey(showContinentKey) {
    var keyElementWidth = 200,
        keyElementHeight = 30;
    var onScreenYOffset = keyElementHeight*1.5,
        offScreenYOffset = 100;

    //后面就是给这个变量加了个时间动画，
    var continentKey = d3.select(".continent-key");

    if (showContinentKey) {
      translateContinentKey("translate(0," + (height - onScreenYOffset) + ")");
    } else {
      translateContinentKey("translate(0," + (height + offScreenYOffset) + ")");
    }

    function translateContinentKey(translation) {
      continentKey
        .transition()
        .duration(500)
        .attr("transform", translation);
    }
  }

//旗帜渲染转换
  function flagFill() {
    return isChecked("#flags");
  }

  function isChecked(elementID) {
    return d3.select(elementID).property("checked");
  }

//绘制圆
  function createCircles() {
    var formatPopulation = d3.format(",");
    circles = svg.selectAll("circle")
      .data(countries)
      .enter()
        .append("circle")
        .attr("r", function(d) { return circleRadiusScale(d.Weight); })
        .on("mouseover", function(d) {
          updateCountryInfo(d);
        })
        .on("mouseout", function(d) {
          updateCountryInfo();
        })
        .on("click",function(d){
          keyClickFunction(d);
        })
    updateCircles();

    function updateCountryInfo(country) {
      var info = "";
      if (country) {
        info = country.Artists_Name;
      }
      d3.select("#title_space").html(info);
    }
      
    function keyClickFunction(country){
        //jump to the link window
        window.location.href = country.Primary_Link
    }
      
  }

//刷新绘制
  function updateCircles() {
    circles
      .attr("fill", function(d) {
        return flagFill() ? "url(#" + d.Artists_Name + ")" : continentColorScale(d.ContinentCode);
      });
  }

//创建挤压效果
  function createForces() {
    var forceStrength = 0.05;

    forces = {
      combine:  createCombineForces(),
    };

    function createCombineForces() {
      return {
        x: d3.forceX(width / 2).strength(forceStrength),
        y: d3.forceY(height / 2).strength(forceStrength)
      };
    }

  }

//继续力的定义
  function createForceSimulation() {
    forceSimulation = d3.forceSimulation()
      .force("x", forces.combine.x)
      .force("y", forces.combine.y)
      .force("collide", d3.forceCollide(forceCollide));
    forceSimulation.nodes(countries)
      .on("tick", function() {
        circles
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });
  }

//基础的也是需要的汇聚方式
  function forceCollide(d) {
    return circleRadiusScale(d.Weight) + 1;
  }
    
  function addFlagDefinitions() {
    var defs = svg.append("defs");
    defs.selectAll(".flag")
      .data(countries)
      .enter()
        .append("pattern")
        .attr("id", function(d) { return d.Artists_Name; })
        .attr("class", "flag")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("patternContentUnits", "objectBoundingBox")
          .append("image")
          .attr("width", 1)
          .attr("height", 1)
          // xMidYMid: center the image in the circle
          // slice: scale the image to fill the circle
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("xlink:href", function(d) {
            return d.Artists_Image;
          });
  }

  function addFillListener() {
    d3.selectAll('input[name="fill"]')
      .on("change", function() {
        toggleContinentKey(!flagFill() && !populationGrouping());
        updateCircles();
      });
  }    

}
