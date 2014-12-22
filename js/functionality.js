var reasonToggle = function() {
  var button = $('[data-reason-button]');
  var productChart = $('[data-product-chart]');
  var reasonChart = $('[data-reason-chart]');
  var reasonButton = $('[data-product-button]');
  if( button.hasClass('active') ){
    return false;
  } else {
    button.toggleClass('active');
    productChart.toggleClass('hidden');
    reasonChart.toggleClass('hidden');
    reasonButton.toggleClass('active');
  }
}

var productToggle = function() {
  var button = $('[data-product-button]')
  var productChart = $('[data-product-chart]');
  var reasonChart = $('[data-reason-chart]');
  var reasonButton = $('[data-reason-button]');

  if( button.hasClass('active') ){
    return false;
  } else {
    button.toggleClass('active');
    productChart.toggleClass('hidden');
    reasonChart.toggleClass('hidden');
    reasonButton.toggleClass('active');
  }
}
$('[data-product-button]').click(function(e) {
  productToggle();
});

$('[data-reason-button]').click(function(e) {
  reasonToggle();
});

$('[data-filter-turkey]').click(function(e) {
  dc.filterAll();
  countryRowChart.filter('Turkey');
  dc.redrawAll();
});

$('[data-filter-france]').click(function(e) {
  dc.filterAll();
  countryRowChart.filter('France');
  dc.redrawAll();
});

$('[data-filter-national-security]').click(function(e) {
  dc.filterAll();
  reasonToggle();
  reasonBarChart.filter('National Security');
  dc.redrawAll();
});

$('[data-filter-defamation]').click(function(e) {
  dc.filterAll();
  reasonToggle();
  reasonBarChart.filter('Defamation');
  dc.redrawAll();
});

