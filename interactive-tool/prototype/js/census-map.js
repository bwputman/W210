// Global variables
feature_operators = ['+', '+', '+'];
feature_scalars = [0, 0, 0];
feature_units = ['%', '%', '%'];
risk_area_counts = [0, 0, 0];
desert_color = 'Blue';
num_features = 3;
possible_operators = ['+', '-'];

possible_units = [['%'],
                  ['%'],
                  ['%']];

feature_handles = [null, null, null];



all_features = ["Total; Estimate; Some college no degree", 
                "Percent; TENURE 0 Occupied housing units 0 Owner occupied 0 Owned free and clear",
                "Unemployment rate; Estimate; EDUCATIONAL ATTAINMENT 0 Some college or associate's degree",
                "TractNum",
                "HUNVFlag",
                "PCTGQTRS",
                "Urban",
                "Percent; OCCUPANCY STATUS 0 Total housing units"];
               
displayed_features = ["College Dropouts",                     // all_features[0]
                      "Unemployed College Attendees",   // all_features[2]
                      "Individuals in Public Housing"];           // all_features[5]
displayed_features_idx = [0, 2, 5];
displayed_features_desc = ["Total number of individuals who started college but did have no degree (either associates or bachelors)",
                           "Unemployment rate for individuals who attended college but do not have a bachelor's degree",
                           "Percent of the population living in public housing"];         
                          

function initializeMap() {
  body = d3.select('body');
  map_container = body.select('#map_container');
  map_container.selectAll("*").remove();
  map_container.append('div').attr('id', 'map');
  map_container.append('div').attr('id', 'control_widget');
    
  // Create map object
  map = new L.Map('map', {
  	center: [37.770, -122.41],
  	zoom: 5.5
  });
  
  // Remove leaflet attribution from the map (we'll put attributions somewhere else)
  document.getElementsByClassName('leaflet-control-attribution')[0].style.display = 'none';
  
  // Add base layer to map
  base_layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
  base_layer.addTo(map);

  // Create control widget (in closed format)
  control_widget = map_container.select('#control_widget');
  widget_expander = control_widget.append('button')
                                  .attr('id', 'widget_expander')
                                  .attr('onClick', 'openControlWidget()')
                                  .attr('title', 'Open Controls')
                                  .text('<<');

  addCensusLayer();
  // Add census layer with "loading" graphic
  /*
  toggleLoadingGraphic("on");
  new Promise((resolve, reject) => resolve(addCensusLayer())).then(() => 
    toggleLoadingGraphic("off"));
  */
  
} // End of initializeMap() function 


function addCensusLayer() {
  risk_area_counts = [0, 0, 0];

  census_layer =  new L.Shapefile('data/ca-census-tract-shapefiles.zip', {
      style: function(feature) {
      
        // We're looping over shapefiles here...
        
        // Extract tract id of current shapefile
        var current_tract_id = String(feature.properties.STATEFP) + 
                               String(feature.properties.COUNTYFP) + 
                               String(feature.properties.TRACTCE);
        current_tract_id = parseInt(current_tract_id);
        
        // Escape condition - tract data not found
        if (Object.keys(tract_features).indexOf(String(current_tract_id)) == -1) {
          return null;
        }
        
        
        // Get feature values associated with current tract id
        current_feature_values = [];
        for (var i = 0; i < all_features.length; i++) {
          current_feature_values.push(parseFloat(tract_features[current_tract_id][all_features[i]]));
        }
        
        
        // Rescale feature values based on user input
        rescaleFeatures(current_feature_values);
        
        
        var likelihood = parseInt(predictLikelihood(current_tract_id, current_feature_values));
        risk_area_counts[likelihood] += 1;
        
        
        // Format shapefile according to food desert likelihood (calculated via predictLikelihood() function call)
        return {color: 'grey',
                opacity: 0.1,
                weight: 1,
                fillColor: desert_color,
                fillOpacity: (0.1 + 0.35 * likelihood)};
        }
      
      }); // End of return shapefile block
      
      if (typeof(census_layer) != 'undefined') {
        census_layer.addTo(map);
      }
} // End of addCensusLayer() function


function rescaleFeatures(feature_values) {
  for (var i = 0; i < feature_values.length; i++) {
    feature_values[i] = parseFloat(feature_values[i]);
    /*
      Define scalar based on context. For example:
      [operator = + , scalar = 5, unit = $] would parse as [feature value + $5]
      [operator = - , scalar = 40, unit = %] would parse as [feature value - (40% of feature value)]
    */
    var scalar = parseFloat(feature_scalars[i]);
    if (feature_units[i] == '%' && i < 2) {
      scalar = (scalar / 100) * feature_values[i];
    }

    if (feature_operators[i] == '+') {
      feature_values[displayed_features_idx[i]] += scalar;
    }
    else {
      feature_values[displayed_features_idx[i]] -= scalar;
    }
  }
}


function openControlWidget() {
  var control_width = 350;
  
  // Expand widget
  control_widget.style('width', control_width)
                .style('left', '550px');
                
  // Repurpose widget expander to close widget
  widget_expander.attr('onclick', 'closeControlWidget()')
                 .attr('title', 'Close Controls')
                 .text('>>');
                 
  // Create feature control title box
  control_widget.append("text")
                .text('Feature Manipulation')
                .style('top', '20px');
                
  // Loop over feature arrays to create individual feature controls        
  for (var i = 0; i < num_features; i++) {
    feature_handles[i] = control_widget.append("form")
                                       .attr('class', 'feature_control')
                                       .attr('name', 'feature_' + String(i))
                                       .style('top', String(70 + (60*i)));
                                       
    // Add feature name     
    feature_handles[i].append("text")
                      .attr('class', 'feature_name')
                      .attr('title', displayed_features_desc[i])
                      .text(displayed_features[i]);
                      
    // Add feature operator dropdown         
    feature_handles[i].append("select")
                      .attr('title', 'Select Operator')
                      .attr('id', 'operator');
    
    // Add operator selection options (default selection == feature_operators[i])
    // TODO: Find a cleaner way to do this
    for (j = 0; j < possible_operators.length; j++) {
      if (possible_operators[j] == feature_operators[i]) {
        feature_handles[i].select("#operator").append("option")
                                              .attr('name', possible_operators[j])
                                              .attr('selected', 'selected')
                                              .text(possible_operators[j]);
      }
      else {
        feature_handles[i].select("#operator").append("option")
                                              .attr('name', possible_operators[j])
                                              .text(possible_operators[j]);
      }
    }
    
    // Add feature scalar input field          
    feature_handles[i].append("input")
                      .attr('title', 'Enter Scalar')
                      .attr('type', 'text')
                      .attr('value', String(feature_scalars[i]))
                      .attr('id', 'scalar');

    // Add feature unit dropdown
    feature_handles[i].append('select')
                      .attr('title', 'Select Unit')
                      .attr('value', String(feature_units[i]))
                      .attr('id', 'unit');
                      
    // Add unit selection options (default selection == feature_units[i])
    // TODO: Find a cleaner way to do this
    for (j = 0; j < possible_units[i].length; j++) {
      if (possible_units[i][j] == feature_units[i]) {
        feature_handles[i].select("#unit").append("option")
                                            .attr('name', possible_units[i][j])
                                            .attr('selected', 'selected')
                                            .text(possible_units[i][j]);
      }
      else {
        feature_handles[i].select("#unit").append("option")
                                            .attr('name', possible_units[i][j])
                                            .text(possible_units[i][j]);
      }
    }
      
    // Add feature reset button                
    feature_handles[i].append("input")
                      .attr('type', 'button')
                      .attr('title', "Reset " + String(displayed_features[i]))
                      .attr('id', 'reset_button')
                      .attr('name', 'reset_' + String(i))
                      .attr('value', '\u21BA')
                      .on('click', function() {resetFeature(parseInt(this.name.slice(-1)));});
                      
  } // End of feature creation loop


  // Create recolor map button
  control_widget.append("button")
                .attr('id', 'recolor_map')
                .attr('onClick', 'recolorMap();')
                .attr('title', 'Recolor Map With Scaled Feature Values')
                .text('Recolor Map')
                .style('background-color', desert_color)
                .style('top', String(30 + (40*(num_features + 3))));
  
  // Create legend title box
  control_widget.append("text")
                .text("Legend")
                .style('top', String(50 + (40*(num_features + 4))));

                
  // Create low risk box           
  low_risk = control_widget.append("div")
                           .attr('id', 'low_risk')
                           .style('top', String(50 + (40*(num_features + 5))))
                           .style('width', String(control_width * 0.8));
                      
  low_risk.append('div').attr('id', 'key')
                        .style('left', '10%');
  low_risk.append('text').attr('id', 'value')
                         .style('left', '40%')
                         .text('Low Risk Area');
  
  // Create medium risk box
  medium_risk = control_widget.append("div")
                              .attr('id', 'medium_risk')
                              .style('top', String(50 + (40*(num_features + 6))))
                              .style('width', String(control_width * 0.8));
  
  medium_risk.append('div').attr('id', 'key')
                           .style('left', '10%');
  medium_risk.append('text').attr('id', 'value')
                            .style('left', '40%')
                            .text('Med. Risk Area');
          
  // Create high risk box           
  high_risk = control_widget.append("div")
                            .attr('id', 'high_risk')
                            .style('top', String(50 + (40*(num_features + 7))))
                            .style('width', String(control_width * 0.8));

  high_risk.append('div').attr('id', 'key')
                        .style('left', '10%');
  high_risk.append('text').attr('id', 'value')
                         .style('left', '40%')
                         .text('High Risk Area');
                         
  updateCountDisplays();
  
} // End of openControlWidget() function


function updateCountDisplays(){
  low_risk.select('#count').remove();
  medium_risk.select('#count').remove();
  high_risk.select('#count').remove();
     
  low_risk.append('text').attr('id', 'count')
                         .style('left', '50%')
                         .text(String(risk_area_counts[0]));
  medium_risk.append('text').attr('id', 'count')
                         .style('left', '50%')
                         .text(String(risk_area_counts[1]));
  high_risk.append('text').attr('id', 'count')
                         .style('left', '50%')
                         .text(String(risk_area_counts[2]));
}


function closeControlWidget(){
  // Gather user-defined information
  saveFeatureInput();
  
  // Clear all control widget children from the DOM and shrink the widget
  control_widget.selectAll('*').remove();
  control_widget.style('width', '2%')
                .style('left', '98%');
  
  // Re-add the widget expander button to the control widget
  widget_expander = control_widget.append('button')
                                  .attr('id', 'widget_expander')
                                  .attr('onClick', 'openControlWidget()')
                                  .attr('title', 'Open Controls')
                                  .text('<<');
                                  
} // End of closeControlWidget() function

function recolorMap() {
 
  if (typeof(census_layer) != 'undefined') {
  // Gather current user-defined feature manipulations
  saveFeatureInput();
  
  // Remove old census layer
  map.removeLayer(census_layer);
  }
  
  // Add new census layer
  toggleLoadingGraphic("on");
  new Promise((resolve, reject) => resolve(addCensusLayer())).then(() => 
    updateCountDisplays()).then(() =>
    toggleLoadingGraphic("off"));
} // End of recolorMap() function


function saveFeatureInput() {
   for (var i = 0; i < num_features; i++) {
    feature_operators[i] = feature_handles[i].select("#operator").node().value;
    feature_scalars[i] = feature_handles[i].select("#scalar").node().value;
    feature_units[i] = feature_handles[i].select("#unit").node().value;
  }
}


function resetFeature(reset_id) {
  // Revert current operator to default
  feature_operators[reset_id] = '+';
  var operators = feature_handles[reset_id].select("#operator").node().options;
  for (var i = 0; i < operators.length; i++) {
    if (operators[i].getAttribute('name') == feature_operators[reset_id]) {
      operators[i].setAttribute('selected', 'selected');
    }
    else {
      operators[i].removeAttribute('selected');
    }
  }
  
  // Revert current value to default
  feature_scalars[reset_id] = 0;
  feature_handles[reset_id].select('#scalar').attr('value', feature_scalars[reset_id]);
  
  // Revert current unit to default
  feature_units[reset_id] = '%';
  var units = feature_handles[reset_id].select("#unit").node().options;
  for (i = 0; i < units.length; i++) {
    if (units[i].getAttribute('name') == feature_units[reset_id]) {
      units[i].setAttribute('selected', 'selected');
    }
    else {
      units[i].removeAttribute('selected');
    }
  }
  
  // Reset form with current operator/scalar/unit
  feature_handles[reset_id].node().reset();
}


function toggleLoadingGraphic(toggle) {
  
  if (toggle == 'on') {
    console.log("Show \"Loading\" Graphic.");
  }
  else {
    console.log("Hide \"Loading\" Graphic.");
  }
  
}
