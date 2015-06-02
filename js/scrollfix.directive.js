'use strict';

angular.module('app').directive('scrollfix', ['$timeout', function($timeout) {
    return {
        restrict : 'A',
        link : function($scope, $element, attrs) {
            var baseTop, height;

            var reset = function() {
                var bodyRect = document.body.getBoundingClientRect();
                var rect = $element[0].getBoundingClientRect();
                baseTop = rect.top - bodyRect.top;
                height = rect.height;
            };

            $timeout(function() {
                reset();
            }, 1);

            angular.element(window).on('scroll', function(event) {
                if (event.currentTarget.scrollY <= baseTop) {
                    $element.css({
                        position : 'relative',
                        top : '0',
                        width : 'auto',
                    });
                } else {
                    $element.css({
                        position : 'fixed',
                        top : attrs.scrollfix + 'px',
                        width : '100%',
                    });
                }
            });
        }
    };
}]);