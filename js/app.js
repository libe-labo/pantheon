'use strict';

var app = angular.module('app', ['lheader', 'ngTouch']);

app.controller('Ctrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    var allData = [];
    $scope.data = [];
    $scope.resetFixed = false;

    $scope.filters = [
        {
            label : 'Tous',
            f : function() {
                $scope.activeFilters = { gender : '' , corps : '' };
            }
        },
        {
            label : 'Femmes',
            f : function() {
                $scope.activeFilters = { gender : 'femme' , corps : '' };
            }
        },
        {
            label : 'Hommes',
            f : function() {
                $scope.activeFilters = { gender : 'homme' , corps : '' };
            }
        }
    ];

    $scope.activeFilters = {
        gender : '',
        category : ''
    };

    $scope.steps = [];
    $scope.currentStep = 0;

    var setCoverImage = function() {
        $scope.coverImage = { };
        if ($scope.steps[$scope.currentStep].image.length > 0) {
            $scope.coverImage['background-image'] = 'url(' + $scope.steps[$scope.currentStep].image + ')';
            if ($scope.currentStep === 0) {
                $scope.coverImage['background-position'] = 'center 75%';
            } else if ($scope.currentStep === 1) {
                $scope.coverImage['background-position'] = 'center top';
            } else {
                $scope.coverImage['background-position'] = 'center';
            }
        }
    };

    $http.get('data/steps.csv').then(function(response) {
        var csvArray = CSVToArray(response.data);
        var csvHeader = _.first(csvArray.splice(0, 1));
        csvHeader = _.invert(csvHeader);

        for (var i = 0; i < csvArray.length; ++i) {
            $scope.steps.push({
                title : csvArray[i][csvHeader.Titre],
                ids : _.map(csvArray[i][csvHeader.Ids].split(','), function(d) { return parseInt(d); }),
                desc : $sce.trustAsHtml('<span class="slug">' + csvArray[i][csvHeader.Slug] +
                                        '</span> ' + csvArray[i][csvHeader.Texte]),
                mobileDesc : $sce.trustAsHtml('<span class="slug">' + csvArray[i][csvHeader.Slug] +
                                              '</span> ' + csvArray[i][csvHeader['Texte mobile']]),
                image : csvArray[i][csvHeader.Image]
            });

            if (isNaN($scope.steps[$scope.steps.length - 1].ids[0])) {
                $scope.steps[$scope.steps.length - 1].ids = [];
            }
        }
        $scope.resetFixed = true;

        $http.get('data/data.csv').then(function(response) {
            var csvArray = CSVToArray(response.data);
            var csvHeader = _.first(csvArray.splice(0, 1));

            csvHeader = _.invert(csvHeader);
            allData = [];
            var categories = [];
            for (var i = 0; i < csvArray.length; ++i) {
                allData.push({
                    birth : parseInt(csvArray[i][csvHeader.Naissance]),
                    death : parseInt(csvArray[i][csvHeader.Mort]),
                    pantheon : parseInt(csvArray[i][csvHeader['Panthéonisation']]),
                    label : csvArray[i][csvHeader['Prénom']] + ' ' + csvArray[i][csvHeader.Nom],
                    gender : csvArray[i][csvHeader.Sexe],
                    category : $sce.trustAsHtml(csvArray[i][csvHeader['Métier']]),
                    id : parseInt(csvArray[i][csvHeader.id]),
                    fadedout : [62, 52].indexOf(parseInt(csvArray[i][csvHeader.id])) >= 0,
                    corps : csvArray[i][csvHeader.Corps],
                    lien : csvArray[i][csvHeader.Lien]
                });

                var category = allData[allData.length - 1].corps;
                if (categories.indexOf(category) < 0) {
                    categories.push(category);
                    if (category !== 'pas en son nom propre') {
                        $scope.filters.push({
                            label : category,
                            f : (function(category) {
                                return function() {
                                    $scope.activeFilters = { gender : '' , corps : category };
                                };
                            })(category)
                        });
                    }
                }
            }
            $scope.data = _.clone(allData);
            $scope.filter($scope.steps[$scope.currentStep].ids);
            setCoverImage();
        });
    });


    $scope.filter = function(ids) {
        if (ids == null || ids.length <= 0) {
            $scope.data = _.map(allData, function(datum) {
                datum.filteredOut = false;

                for (var i in $scope.activeFilters) {
                    if ($scope.activeFilters.hasOwnProperty(i) &&
                        $scope.activeFilters[i].length > 0) {
                        /* jslint bitwise: true */
                        datum.filteredOut |= datum[i] !== $scope.activeFilters[i];
                        /* jslint bitwise: false */
                    }
                }

                return datum;
            });
        } else {
            $scope.activeFilters = {
                gender : '',
                category : ''
            };
            $scope.selectedFilter = 'Tous';
            $scope.data = _.map(allData, function(datum) {
                datum.filteredOut = ids.indexOf(datum.id) < 0;
                return datum;
            });
        }

        $scope.data = _.sortByOrder($scope.data, ['pantheon', 'filteredOut'], [false, true]);
    };

    $scope.isFirstStep = function() {
        return $scope.currentStep === 0;
    };

    $scope.isLastStep = function() {
        return $scope.currentStep === $scope.steps.length - 1;
    };

    $scope.prevStep = function() {
        $scope.goToStep($scope.currentStep - 1);
    };

    $scope.nextStep = function() {
        $scope.goToStep($scope.currentStep + 1);
    };

    $scope.goToStep = function(index) {
        if ($scope.steps[index] != null) {
            $scope.currentStep = index;
            $scope.filter($scope.steps[$scope.currentStep].ids);
            setCoverImage();
        }
    };

    $scope.selectFilter = function() {
        for (var i = 0; i < $scope.filters.length; ++i) {
            if ($scope.filters[i].label === $scope.selectedFilter) {
                $scope.filters[i].f();
                $scope.filter();
                break;
            }
        }
    };
}]);