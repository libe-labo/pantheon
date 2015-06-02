'use strict';

angular.module('app').directive('timeline', ['$timeout', function($timeout) {
    return {
        restrict : 'AE',
        scope : {
            data : '='
        },
        link : function($scope, $element) {
            var currentYear = (new Date(Date.now())).getFullYear();

            var svg = d3.select($element[0]).append('svg');
            var margin = {
                top: 0,
                right: 30,
                bottom: 30,
                left: 30,
                between : 15
            };
            var barHeight = margin.between * 1.5;
            var width = $element.width() - margin.left - margin.right;
            var height = margin.top + margin.bottom + ($scope.data.length * (barHeight + margin.between));
            svg.attr('width', width).attr('height', height);
            svg = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
            var bars = svg.append('g').attr('class', 'bars');
            var x;

            var getY = function(d, i) {
                return margin.between  + (i * (barHeight + margin.between));
            };

            var refresh = function() {
                height = margin.top + margin.bottom + ($scope.data.length * (barHeight + margin.between));
                d3.select($element[0]).select('svg').attr('height', height);

                if (x == null) {
                    x = d3.scale.linear()
                          .domain([d3.min($scope.data, function(d) { return d.birth; }) - 5,
                                   currentYear + 5])
                          .range([0, width]);

                    var rulers = svg.insert('g', '.bars').attr('class', 'rulers');
                    _.each(x.ticks(), function(tick) {
                        rulers.append('line').attr('class', 'ruler')
                              .attr('x1', x(tick)).attr('x2', x(tick))
                              .attr('y1', 0).attr('y2', height);
                    });
                }

                // Start drawing
                var bar = bars.selectAll('.bar').data($scope.data, function(d) { return d.id; });
                var entered = bar.enter().append('g').attr('class', 'bar');
                bar.exit().remove();

                bar.sort(function(a, b) {
                    return d3.ascending(a.filteredOut, b.filteredOut) ||
                           d3.descending(a.pantheon, b.pantheon);
                });

                entered.append('rect').attr('class', 'life')
                   .attr('x', function(d) { return x(d.birth); })
                   .attr('width', function(d) { return x(d.death) - x(d.birth); })
                   .attr('height', barHeight)
                   .on('mouseenter', function(d) {
                        var event = d3.event;

                        jQuery($element).popover('destroy');
                        jQuery($element).popover({
                            title : d.label,
                            trigger : 'click',
                            container : 'body',
                            html : true,
                            animation : false,
                            content : '<p>' + d.birth + ' - ' + d.death + '</p>' +
                                      '<p><i class="fa fa-university"></i> ' + d.pantheon + '</p>' +
                                      '<p>' + d.category + '</p>',
                            placement : 'bottom'
                        }).on('shown.bs.popover', function() {
                            var y = event.pageY;
                            if (event.pageY > jQuery('body').height() - (jQuery('.popover').height() * 2)) {
                                y -= jQuery('.popover').height();
                            }
                            jQuery('.popover').css({
                                top : y,
                                left : event.pageX
                            });
                        }).popover('show');
                   }).on('mouseleave', function() {
                        jQuery($element).popover('destroy');
                   });

                entered.append('line')
                       .attr('x1', function(d) { return x(d.death); })
                       .attr('x2', function(d) { return x(d.pantheon); });

                entered.append('circle').attr('class', 'pantheon')
                       .attr('cx', function(d) { return x(d.pantheon); })
                       .attr('r', barHeight / 4);

                entered.append('text').text(function(d) { return d.label; })
                   .attr('text-anchor', 'start')
                   .attr('x', function(d) { return x(d.birth); });

                // Re-compute y positions and colors
                bars.selectAll('.bar').select('rect.life')
                    .transition().attr('y', getY)
                                 .style('fill', function(d) { return d.filteredOut ? '#ddd' : (d.fadedout ? '#867D7A' : '#222'); });

                bars.selectAll('.bar').select('line').transition()
                    .attr('y1', function(d, i) { return getY(d, i) + (barHeight / 2); })
                    .attr('y2', function(d, i) { return getY(d, i) + (barHeight / 2); })
                    .style('stroke', function(d) { return d.filteredOut ? '#ddd' : (d.fadedout ? '#867D7A' : '#222'); });

                bars.selectAll('.bar').select('circle.pantheon').transition()
                    .attr('cy', function(d, i) { return getY(d, i) + (barHeight / 2); })
                    .style('fill', function(d) { return d.filteredOut ? '#ddd' : (d.fadedout ? '#867D7A' : '#222'); });

                bars.selectAll('.bar').select('text')
                    .transition()
                    .attr('y', function(d, i) { return barHeight + getY(d, i); });
            };

            var refreshWidth = function() {
                width = $element.width() - margin.left - margin.right;
                x = d3.scale.linear()
                      .domain([d3.min($scope.data, function(d) { return d.birth; }) - 5,
                               d3.max($scope.data, function(d) { return d.pantheon; }) + 5])
                      .range([0, width]);

                svg.selectAll('.rulers').remove();
                var rulers = svg.insert('g', '.bars').attr('class', 'rulers');
                _.each(x.ticks(), function(tick) {
                    rulers.append('line').attr('class', 'ruler')
                          .attr('x1', x(tick)).attr('x2', x(tick))
                          .attr('y1', 0).attr('y2', height);
                });

                bars.selectAll('.bar').select('rect.life')
                    .attr('x', function(d) { return x(d.birth); })
                    .attr('width', function(d) { return x(d.death) - x(d.birth); });

                bars.selectAll('.bar').select('line')
                    .attr('x1', function(d) { return x(d.death); })
                    .attr('x2', function(d) { return x(d.pantheon); });

                bars.selectAll('.bar').select('circle.pantheon')
                    .attr('cx', function(d) { return x(d.pantheon); });

                bars.selectAll('.bar').select('text')
                    .attr('x', function(d) { return x(d.birth); });
            };

            $scope.$watch('data', function() {
                if ($scope.data != null && $scope.data.length > 0) {
                    refresh();
                }
            });

            angular.element(window).on('resize', (function() {
                var timeout; // We're doing some sort of debounce to call this
                return function() { // handler only when the resize is finished.
                    $timeout.cancel(timeout);
                    timeout = $timeout(function() {
                        if ($scope.data != null && $scope.data.length > 0) {
                            refreshWidth();
                        }
                    }, 100);
                };
            })());
        }
    };
}]);

angular.module('app').directive('axis', ['$timeout', function($timeout) {
    return {
        restrict : 'AE',
        scope : {
            data : '='
        },
        link: function($scope, $element) {
            var currentYear = (new Date(Date.now())).getFullYear();
            var x, axis;
            var margin = 30;
            var width = $element.width() - (margin * 2);
            var height = 50;
            var svg = d3.select($element[0]).append('svg');
            svg.attr('width', width).attr('height', height);

            var refresh = function() {
                x = d3.scale.linear()
                      .domain([d3.min($scope.data, function(d) { return d.birth; }) - 5,
                               currentYear + 5])
                      .range([0, width]);

                axis = d3.svg.axis().scale(x).orient('top').tickFormat(function(t) { return t; });

                svg.selectAll('.axis').remove();
                svg.append('g').attr('class', 'axis').attr('transform', 'translate(' + margin + ', ' + height + ')')
                   .call(axis);
            };

            $scope.$watch('data', function() {
                if ($scope.data != null && $scope.data.length > 0) {
                    refresh();
                }
            });

            angular.element(window).on('resize', (function() {
                var timeout; // We're doing some sort of debounce to call this
                return function() { // handler only when the resize is finished.
                    $timeout.cancel(timeout);
                    timeout = $timeout(function() {
                        width = $element.width() - (margin * 2);
                        refresh();
                    }, 100);
                };
            })());
        }
    };
}]);