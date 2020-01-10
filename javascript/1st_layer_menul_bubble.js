//关键字绘制参数
function create1st_MenulBubble(error, countries, continentNames) {

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
  toggleContinentKey();
  createCircles();
  createForces();
  createForceSimulation();

  function createSVG() {
    svg = d3.select("#bubble-chart")
      .append("svg")
        .attr("width", width)
        .attr("height", height);
  }

  function toggleContinentKey() {
    var keyElementWidth = 200,
        keyElementHeight = 30;
    var onScreenYOffset = keyElementHeight*1.5,
        offScreenYOffset = 100;

    if (d3.select(".continent-key").empty()) {
      createContinentKey();
    }
    
    //后面就是给这个变量加了个时间动画，
    var continentKey = d3.select(".continent-key");

    translateContinentKey("translate(0," + (height - onScreenYOffset) + ")");

    function createContinentKey() {
      var keyWidth = keyElementWidth * continents.values().length;
      var continentKeyScale = d3.scaleBand()
        .domain(continents.values())
        .range([(width - keyWidth) / 2, (width + keyWidth) / 2]);
        
        
        //continent-key是底部的颜色图例栏
      svg.append("g")
        .attr("class", "continent-key")
        .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
        .selectAll("g")
        .data(continents.values())
        .enter()
          .append("g")
            .attr("class", "continent-key-element");
        
        //画底部矩形
      d3.selectAll("g.continent-key-element")
        .append("rect")
          .attr("width", keyElementWidth)
          .attr("height", keyElementHeight)
          .attr("x", function(d) { return continentKeyScale(d); })
          .attr("fill", function(d) { return continentColorScale(d); });
        
        //在矩形上写字
      d3.selectAll("g.continent-key-element")
        .append("text")
          .attr("text-anchor", "middle")
          .attr("x", function(d) { return continentKeyScale(d) + keyElementWidth/2; })
          .text(function(d) { return continentNames[d]; });

      // The text BBox has non-zero values only after rendering
      d3.selectAll("g.continent-key-element text")
          .attr("y", function(d) {
            var textHeight = this.getBBox().height;
            // The BBox.height property includes some extra height we need to remove
            var unneededTextHeight = 4;
            return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
          });
    }

    function translateContinentKey(translation) {
      continentKey
        .transition()
        .duration(500)
        .attr("transform", translation);
    }
  }

//旗帜渲染转换
//  function flagFill() {
//    return isChecked("#flags");
//  }
//
//  function isChecked(elementID) {
//    return d3.select(elementID).property("checked");
//  }

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
        info = country.Key_Words;
      }
      d3.select("#title_space").html(info);
    }
      
    function keyClickFunction(country){
        var info = country.Key_Words;
        var judgeP = false;
        //判断是否存在重复元素
        if(TagsData.length > 0){
            judgeP = ifDublicated(TagsData,info);
        }
    
        if(!judgeP){
            TagsData.push({id:TagsID,name:info,screen:info});
            SelectedData.push(TagsID);
            TagsID += 1;

            //清空之前的输入框
            $( "#DemoInput1").remove();
            $( ".sTags").empty();
            
            $('<input type="text" id="DemoInput1" style="display: none">').appendTo('#inputDiv');
            
            //绘制新的输入框
            $("#inputDiv").sTags({
                defaultData:SelectedData,
                data:TagsData,
                color:1
            })
        }
        
        //展开二级筛选界面
        $('#bubble-chart').empty();
        d3.queue()
            .defer(d3.csv, "sub_selected_key_words_data.csv")
            .defer(d3.json,"art_series.json")
            .await(createMenulBubbleChart);
    }
      
    //判断是否存在重复元素的函数  
    function ifDublicated(textArray,targetString){
        var DataArray = textArray;
        for(var i=0; i<textArray.length;i++){
            if(DataArray[i].name == targetString ){
            return true;
            } else if(i == DataArray.length - 1){
                return false;
            }
        }
    }
  }

//刷新绘制
  function updateCircles() {
    circles
      .attr("fill", function(d) {
        return continentColorScale(d.Group_Code);
      });
  }

//创建挤压效果
  function createForces() {
    var forceStrength = 0.05;

    forces = {
      combine:        createCombineForces(),
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

}
