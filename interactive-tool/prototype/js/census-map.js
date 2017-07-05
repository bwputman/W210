function initializeMap() {
  // Create map object
  var map = new L.Map('map', {
  	center: [37.770, -122.41],
  	zoom: 6
  });
  
  // Remove leaflet attribution from the map (we'll put attributions somewhere else)
  document.getElementsByClassName('leaflet-control-attribution')[0].style.display = 'none';
  
  // Add base layer to map
  // TODO: can/should the base layer be stored locally?
  base_layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
  base_layer.addTo(map);
  
  // Add census layer to map
  census_layer = new L.Shapefile('data/ca-census-tract-shapefiles.zip', {
    style: function(feature) {
      return {color: 'grey',
              opacity: 0.1,
              weight: 1,
              fillColor: 'blue', 
              fillOpacity: (0.1 + 0.35 * (feature.properties.TRACTCE % 3))};
    }
  });
  census_layer.addTo(map);
  

	           
  // TODO: create d3 handles for control widget objects
  body = d3.select('body');
  map_container = body.select('#map_container');
  census_map = map_container.select('#map');
  control_widget = map_container.select('#control_widget');
  widget_expander = control_widget.append('button')
                                  .attr('name', 'widget_expander')
                                  .attr('onClick', 'openControlWidget()')
                                  .attr('title', 'Open Controls')
                                  .text('<<');
  
  num_features = 4;
  feature_handles = [null, null, null, null];
  feature_names = ['Feature Number 1', 'Feature Number 2', 'Feature Number 3', 'Feature Number 4'];
  feature_operators = ['+', '+', '-', 'X'];
  feature_values = ['######', '######', '######', '######'];
  feature_units = ['$', '\u00B0F', 'lb.', '%'];
}

function openControlWidget() {
  var control_width = 350;
  
  // Expand widget
  control_widget.style('width', control_width)
                .style('left', '550px');
  widget_expander.attr('onclick', 'closeControlWidget()')
                 .attr('title', 'Close Controls')
                 .style('position', 'absolute')
                 .style('z-value', '4')
                 .text('>>');
                 
  // Populate widget
  
  // Feature manipulation title box
  control_widget.append("text")
                .text('Feature Manipulation')
                .style('text-align', 'center')
                .style('width', '100%')
                .style('height', '20px')
                .style('color', 'white')
                .style('position', 'absolute')
                .style('top', '20px')
                .style('z-index', '3');
        
  // Loop over feature arrays to create individual feature controls        
  for (i = 0; i < num_features; i++) {
    feature_handles[i] = control_widget.append("div")
                                       .attr('id', 'feature_control')
                                       .style('position', 'absolute')
                                       .style('width', '96%')
                                       .style('height', '20px')  
                                       .style('left', '2%')
                                       .style('top', String(60 + (40*i)))
                                       .style('z-index', '3');
             
    // Feature name     
    feature_handles[i].append("text")
                      .text(feature_names[i])
                      .style('text-align', 'center')
                      .style('height', '20px') 
                      .style('width', '38%')
                      .style('color', 'white')                   
                      .style('position', 'absolute')
                      .style('z-index', '3');
         
    // Feature operator             
    var dropdown = feature_handles[i].append('select')
                                     .attr('title', 'Select Operator')
                                     .style('text-align', 'center')
                                     .style('height', '20px') 
                                     .style('width', '12%')                     
                                     .style('position', 'absolute')
                                     .style('z-index', '3')
                                     .style('left', '40%');
                                     
    dropdown.append('option').text('+');
    dropdown.append('option').text('-');
    dropdown.append('option').text('x');                
        
    // Feature value              
    feature_handles[i].append("input")
                      .text(feature_values[i])
                      .attr('title', 'Enter Value')
                      .style('text-align', 'center')
                      .style('height', '20px') 
                      .style('width', '18%')
                      .style('color', 'black')
                      .style('position', 'absolute')
                      .style('z-index', '3')
                      .style('left', '54%');
                      
    // Feature units
    dropdown = feature_handles[i].append('select')
                                 .attr('title', 'Select Unit')
                                 .style('text-align', 'center')
                                 .style('height', '20px') 
                                 .style('width', '12%')                     
                                 .style('position', 'absolute')
                                 .style('z-index', '3')
                                 .style('left', '74%');
    dropdown.append('option').text('$');
    dropdown.append('option').text('\u00B0F');
    dropdown.append('option').text('lb.');  
    dropdown.append('option').text('%'); 
      
    // Reset button                
    feature_handles[i].append('button')
                      .text('\u21BA')
                      .attr('title', "Reset " + String(feature_names[i]))
                      .style('border-style', 'none')
                      .style('height', '20px')
                      .style('width', '20px')
                      .style('color', 'white')
                      .style('background-color', 'transparent')
                      .style('position', 'absolute')
                      .style('font-size', '80%')
                      .style('z-index', '3')
                      .style('left', '90%')
                      .style('top', '0%');
  } // End of feature loop

  // Year control title box
  control_widget.append("text")
                .text("Year")
                .style('text-align', 'center')
                .style('width', '100%')
                .style('height', '20px')
                .style('color', 'white')
                .style('position', 'absolute')
                .style('top', String(40 + (40*(num_features+1))))
                .style('z-index', '3');
   
  // Year control             
  year_control = control_widget.append("div")
                               .attr('id', 'year_control')
                               .style('position', 'absolute')
                               .style('width', '96%')
                               .style('height', '20px')
                               .style('left', '2%')
                               .style('top', String(40 + (40*(num_features + 2))))
                               .style('z-index', '3');
  
  year_control.append("button")
              .attr('name', 'subtract_year')
              .attr('onClick', 'subtractYear()')
              .attr('title', 'Subtract Year')
              .style('left', '25%')
              .style('top', '-2px')
              .style('background-color', 'transparent')
              .style('color', 'white')
              .style('border-color', 'white')
              .style('height', '25px')
              .style('width', '25px')
              .text('-');
              
  year_control.append("input")
                      .text(feature_values[i])
                      .attr('title', 'Enter Year')
                      .style('width', '20%')
                      .style('color', 'black')
                      .style('position', 'absolute')
                      .style('z-index', '3')
                      .style('left', '40%');
  
    year_control.append("button")
              .attr('name', 'add_year')
              .attr('onClick', 'addYear()')
              .attr('title', 'Add Year')
              .style('left', '68%')
              .style('top', '-2px')
              .style('background-color', 'transparent')
              .style('color', 'white')
              .style('border-color', 'white')
              .style('height', '25px')
              .style('width', '25px')
              .text('+');
              
  // Legend title box
  control_widget.append("text")
                .text("Legend")
                .style('text-align', 'center')
                .style('width', '100%')
                .style('height', '20px')
                .style('color', 'white')
                .style('position', 'absolute')
                .style('top', String(60 + (40*(num_features+3))))
                .style('z-index', '3');
                
  // Low risk box           
  low_risk = control_widget.append("div")
                           .attr('id', 'low_risk')
                           .style('position', 'absolute')
                           .style('width', '96%')
                           .style('height', '20px')
                           .style('left', '2%')
                           .style('top', String(60 + (40*(num_features + 4))))
                           .style('z-index', '3');
                      
  low_risk.append('div')
          .style('height', '15px')
          .style('width', '30px')
          .style('position', 'absolute')
          .style('border-style', 'solid')
          .style('border-weight', '1px')
          .style('border-color', 'white')
          .style('background-color', 'hsl(240, 100%, 90%)')
          .style('left', '25%')
          .style('top', '0%');
          
  low_risk.append('text')
          .style('color', 'white')
          .style('position', 'absolute')
          .style('left', '55%')
          .text('Low Risk Area');
  
  // Medium risk box
  medium_risk = control_widget.append("div")
                              .attr('id', 'medium_risk')
                              .style('position', 'absolute')
                              .style('width', '96%')
                              .style('height', '20px')
                              .style('left', '2%')
                              .style('top', String(60 + (40*(num_features + 5))))
                              .style('z-index', '3');
  
  medium_risk.append('div')
          .style('height', '15px')
          .style('width', '30px')
          .style('border-style', 'solid')
          .style('boder-width', '1px')
          .style('border-color', 'white')
          .style('background-color', 'hsl(240, 100%, 70%)')
          .style('position', 'absolute')
          .style('left', '25%')
          .style('top', '0%');
          
  medium_risk.append('text')
          .style('color', 'white')
          .style('position', 'absolute')
          .style('left', '55%')
          .text('Medium Risk Area');
          
  // High risk box           
  high_risk = control_widget.append("div")
                            .attr('id', 'high_risk')
                            .style('position', 'absolute')
                            .style('width', '96%')
                            .style('height', '20px')
                            .style('left', '2%')
                            .style('top', String(60 + (40*(num_features + 6))))
                            .style('z-index', '3');

  high_risk.append('div')
          .style('height', '15px')
          .style('width', '30px')
          .style('position', 'absolute')
          .style('border-style', 'solid')
          .style('border-weight', '1px')
          .style('border-color', 'white')
          .style('background-color', 'hsl(240, 100%, 50%)')
          .style('left', '25%')
          .style('top', '0%');
          
  high_risk.append('text')
          .style('color', 'white')
          .style('position', 'absolute')
          .style('left', '55%')
          .text('High Risk Area');
}

function closeControlWidget(){
  
  // Clear all control widget children from the DOM
  control_widget.selectAll('*').remove();
  control_widget.style('width', '2%')
                .style('left', '98%');
  
  // Re-add the widget expander button to the control widget
  widget_expander = control_widget.append('button')
                                  .attr('name', 'widget_expander')
                                  .attr('onClick', 'openControlWidget()')
                                  .attr('title', 'Open Controls')
                                  .text('<<');
}

function subtractYear(){
  
}

function addYear(){
  
}