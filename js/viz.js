String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

var orderLineChart = dc.lineChart("#order-line-chart");
var productBarChart = dc.barChart("#product-bar-chart");
var countryRowChart = dc.rowChart("#country-row-chart");
var reasonBarChart = dc.barChart('#reason-bar-chart');

var reasonPreviewBarChart = dc.barChart('#reason-preview-chart');
var productPreviewBarChart = dc.barChart('#product-preview-chart');

var timeFormat = d3.time.format("%m/%d/%Y");

d3.json('json/google-government-removal-request.json', function(error, data){

  data.forEach(function(request){
    request.period_ending_date = timeFormat.parse(request.period_ending);
    request.court_orders = +request.court_orders;
    request.executive_police_etc = +request.executive_police_etc;
    request.items_requested_to_be_removed = +request.items_requested_to_be_removed;
  });

  var topRequestedProducts = ["YouTube", "Web Search", "Blogger", "orkut", "Gmail",
   "Google Images", "Google AdWords", "Google Groups", "Google+", "Picasa Web Albums",
   "Google+ Local", "Google Sites"];

  var topRequestedCountries = ["Brazil", "United States", "India", "Turkey", "Germany",
   "United Kingdom", "France", "Spain", "Italy", "South Korea", "Argentina",];

  var ndx = crossfilter(data);
  var all = ndx.groupAll();

  var countryDimension = ndx.dimension(function(d) {
    if(topRequestedCountries.indexOf(d.country) != -1){ return d.country; }
    else{ return 'Other Countries'; }
  });

  var timeByReportingPeriodDimension = ndx.dimension(function(d) {
    return d.period_ending_date;
  });

  var productDimension = ndx.dimension(function(d) {
    if (topRequestedProducts.indexOf(d.product) != -1){ return d.product; }
    else { return 'Other Products'; }
  });

  var requestReasonDimension = ndx.dimension(function(d) {
    return d.reason.capitalize() || 'None Given';
  });

  var countryDimensionGroup = countryDimension.group().reduce(
    function(p,v) {
      p.orders_sum += v.court_orders;
      p.orders_sum += v.executive_police_etc;
      p.court_orders += v.court_orders;
      p.other_orders += v.executive_police_etc;
      return p;
    },
    function(p,v) {
      p.orders_sum -= v.court_orders;
      p.orders_sum -= v.executive_police_etc;
      p.court_orders -= v.court_orders;
      p.other_orders -= v.executive_police_etc;
      return p;
    },
    function(p,v){
      return { orders_sum: 0, court_orders: 0, other_orders: 0 };
    }
  );

  var productDimensionGroup = productDimension.group().reduce(
    function(p,v) {
      p.item_sum += v.items_requested_to_be_removed;
      p.total_court_orders += v.court_orders;
      p.total_executive_police_etc += v.executive_police_etc;
      p.total_orders +=  (v.court_orders + v.executive_police_etc);
      return p;
    },
    function(p,v) {
      p.item_sum -= v.items_requested_to_be_removed;
      p.total_court_orders -= v.court_orders;
      p.total_executive_police_etc -= v.executive_police_etc;
      p.total_orders -=  (v.court_orders + v.executive_police_etc);
      return p;
    },
    function(p,v){
      return { item_sum: 0 , total_court_orders: 0, total_executive_police_etc: 0, total_orders: 0};
    }
  );

  var ordersByReportingPeriod = timeByReportingPeriodDimension.group().reduce(
    function(p, v){
      p.total_court_orders += v.court_orders;
      p.total_executive_police_etc += v.executive_police_etc;
      p.total_orders += (v.court_orders + v.executive_police_etc);
      return p;
    },
    function(p,v){
      p.total_court_orders -= v.court_orders;
      p.total_executive_police_etc -= v.executive_police_etc;
      p.total_orders -= (v.court_orders - v.executive_police_etc);
      return p;
    },
    function(){
      return { total_court_orders: 0, total_executive_police_etc: 0, total_orders: 0 };
    }
  );

  var requestReasonGroup = requestReasonDimension.group().reduce(
    function(p, v){
      p.total_court_orders += v.court_orders;
      p.total_executive_police_etc += v.executive_police_etc;
      return p;
    },
    function(p,v){
      p.total_court_orders -= v.court_orders;
      p.total_executive_police_etc -= v.executive_police_etc;
      return p;
    },
    function(){
      return { total_court_orders: 0, total_executive_police_etc: 0 };
    }
  );

  reasonCourtTip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) { return '<p> Court Orders: ' + d.data.value.total_court_orders + '</p>' })
    .offset([-10,0]);

  reasonOtherTip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) { return  '<p> Executive, Police, Etc. Orders: ' + d.data.value.total_executive_police_etc +  '</p>' })
    .offset([-10,0]);

  reasonBarChart.width(540)
    .height(480)
    .margins({top: 20, right: 30, bottom: 130, left: 50})
    .transitionDuration(500)
    .dimension(requestReasonDimension)
    .group(requestReasonGroup, 'Court Orders')
    .stack(requestReasonGroup, 'Other Orders', function(d){
      return d.value.total_executive_police_etc;
    })
    .valueAccessor(function (d) {
      return d.value.total_court_orders;
    })
    .elasticY(true)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .gap(5)
    .xAxisLabel('Reasons for Take Down Orders' )
    .yAxisLabel('Order Count' )
    .renderTitle(false)
    .legend(dc.legend().x(400).y(10).itemHeight(13).gap(5))
    .renderlet(function(chart){
      chart.svg().call(reasonCourtTip)
      chart.selectAll('._0 rect')
        .on('mouseover', reasonCourtTip.show)
        .on('mouseout', reasonCourtTip.hide);
      chart.svg().call(reasonOtherTip)
      chart.selectAll('._1 rect')
        .on('mouseover', reasonOtherTip.show)
        .on('mouseout', reasonOtherTip.hide);

      chart.selectAll("g.x text")
        .attr('dx', '-55')
        .attr('dy', '-5')
        .attr('transform', "rotate(-90)");
    })
    .turnOffControls();

  reasonPreviewBarChart.width(35)
    .height(35)
    .margins({top: 0, right: 0, bottom: 0, left: 0})
    .dimension(requestReasonDimension)
    .group(requestReasonGroup)
    .valueAccessor(function (d) {
      return d.value.total_court_orders + d.value.total_executive_police_etc;
    })
    .elasticY(true)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .renderLabel(false)
    .renderTitle(false)
    .gap(0)

   reasonPreviewBarChart.onClick = function(){ }
 // X axis is the product, Y is items removed
  productTip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) { return '<p> Total Orders: ' + d.data.value.total_orders + '</p>'+ '<p> Pieces of Content: ' + d.data.value.item_sum + '</p>' })
    .offset([-10,0]);

  productBarChart.width(540)
    .height(480)
    .margins({top: 20, right: 30, bottom: 130, left: 50})
    .dimension(productDimension)
    .group(productDimensionGroup)
    .y(d3.scale.sqrt(0.1).domain([0,110000]))
    .x(d3.scale.ordinal())
    .xAxisLabel('Google Products')
    .yAxisLabel('Pieces of Content Removed' )
    .xUnits(dc.units.ordinal)
    .renderHorizontalGridLines(true)
    .gap(5)
    .valueAccessor(function(p) {
      return p.value.item_sum || 1;
    })
    .renderLabel(true)
    .renderlet(function(chart){
      chart.svg().call(productTip)
      chart.selectAll('rect')
        .on('mouseover', productTip.show)
        .on('mouseout', productTip.hide)

      chart.selectAll("g.x text")
        .attr('dx', '-55')
        .attr('dy', '-5')
        .attr('transform', "rotate(-90)");
    })
    .turnOffControls()
    .renderTitle(false)
    .ordering(function(d) { return d.item_sum; });

  productPreviewBarChart.width(35)
    .height(35)
    .margins({top: 0, right: 0, bottom: 0, left: 0})
    .dimension(productDimension)
    .group(productDimensionGroup)
    .x(d3.scale.ordinal())
    .valueAccessor(function(p) {
      return p.value.item_sum || 1;
    })
    .y(d3.scale.sqrt(0.1).domain([0,110000]))
    .xUnits(dc.units.ordinal)
    .renderLabel(false)
    .renderTitle(false)
    .gap(0);

   productPreviewBarChart.onClick = function(){}

  //X is time -- ending period dates, Y is the Order count
  orderLineChart.width(540)
    .height(300)
    .margins({top: 0, right: 30, bottom: 40, left: 50})
    .renderArea(true)
    .dimension(timeByReportingPeriodDimension)
    .x(d3.time.scale().domain([new Date(2010, 1, 1), new Date(2012, 12, 31)]))
    .xUnits(d3.time.months)
    .group(ordersByReportingPeriod, 'Court Orders')
    .elasticY(true)
    .renderDataPoints({radius: 5, fillOpacity: 0.8, strokeOpacity: 0.8})
    .renderHorizontalGridLines(true)
    .valueAccessor(function (d) {
      return d.value.total_court_orders;
    })
    .stack(ordersByReportingPeriod, 'Other Orders', function(d){
      return d.value.total_executive_police_etc;
    })
    .legend(dc.legend().x(400).y(10).itemHeight(13).gap(5))
    .xAxisLabel('Time')
    .yAxisLabel('Order Count')
    .renderTitle(false)
    .turnOffControls();

// X is Country, Y Requests made
  countryTip= d3.tip().attr('class', 'd3-tip')
    .html(function(d) {  return '<p> Court Orders: ' + d.value.court_orders + '</p>'+ '<p> Executive, Police, Etc. Orders : ' + d.value.other_orders + '</p>' })
    .direction('e')
    .offset([0, 10]);

  countryRowChart.width(250)
    .margins({top: 10, right: 30, bottom: 49, left: 30})
    .height(878)
    .dimension(countryDimension)
    .group(countryDimensionGroup)
    .valueAccessor(function(p) {
      return p.value.orders_sum;
    })
    .ordinalColors(colorbrewer.Reds[5])
    .colorAccessor(function(d,i){ return i; })
    .elasticX(true)
    .labelOffsetX(10)
    .ordering(function(d) { return d.orders_sum; })
    .on('postRender', function(chart){
      var chartSVG = chart.svg();
      chartSVG.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", countryRowChart.width()/2)
        .attr("y", countryRowChart.height() - 12 )
        .text('Total Orders');

      chartSVG.call(countryTip);
      chart.selectAll('rect')
        .on('mouseover', countryTip.show)
        .on('mouseout', countryTip.hide)
    })
    .renderTitle(false)
    .turnOffControls()
    .xAxis().ticks(5);

  dc.renderAll();
});

