/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />

angular.module('schemaForm').config(['schemaFormProvider',
    'schemaFormDecoratorsProvider', 'sfPathProvider',
    function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {




        // Second, we want it to show if someone have explicitly set the form type
        schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'complex-ui',
            'directives/decorators/bootstrap/complex-ui/angular-schema-form-complex-ui.html');
    }]);

interface ComplexModel {
    options: {};
}
interface DirectiveScope extends ng.IScope {
    ngModel: any[];
    form: ComplexModel;
    schema?: any;
    parentController: ComplexUIController;
    showModal: boolean;
}


// Declare a controller, this is used in the typescriptDirective below
class ComplexUIController {

    directiveScope: DirectiveScope;
    form: {};
    schema: {};
    model: any;

    $broadcast: any;

    toggleModal = function () {
        this.directiveScope.showModal = !this.directiveScope.showModal;
    };


    getCallback = (callback) => {
        if (typeof(callback) == "string") {
            var _result = (this.directiveScope.$parent as any).evalExpr(callback);
            if (typeof(_result) == "function") {
                return _result;
            }
            else {
                throw("A callback string must match name of a function in the parent scope")
            }

        }
        else if (typeof(callback) == "function") {
            return callback;
        }
        else {
            throw("A callback must either be a string matching the name of a function in the parent scope or a " +
            "direct function reference")

        }
    };


    getDefinitions = () => {
        if (this.directiveScope.form["options"]) {
            let schemaRef: string;
            if ("schemaRef" in this.directiveScope.form["options"]) {
                schemaRef = this.directiveScope.form["options"]["schemaRef"]
            }
            else {
                schemaRef = null
            }


            if ("definitionsCallback" in this.directiveScope.form["options"]) {
                let callback = this.getCallback(this.directiveScope.form["options"]["definitionsCallback"])
                let _defs: {} = callback(schemaRef);

                // TODO: This is probably in the wrong order, it should be possible to read form and schema the usual way.
                // How can some get a form and some not.
                if ("form" in _defs) {
                    this.form = _defs["form"];
                } else if ("complexForm" in this.directiveScope.form["options"]) {
                    this.form = this.directiveScope.form["options"]["complexForm"];
                } else {
                    this.form = ["*"];
                }
                (this.form as any).onChange = (this.directiveScope.form as any).onChange;
                this.schema = _defs["schema"];

            }
        }
    };

    innerSubmit = (form) => {
        this.directiveScope.$broadcast("schemaFormValidate");
        console.log(this.model);
    };

    constructor(private $scope: DirectiveScope, element: JQuery) {
        console.log("Initiating the ComplexUI controller" + $scope.toString());
        $scope.parentController = this;
        this.directiveScope = $scope;


    }
}
;


interface modalScope extends ng.IScope {
    title: string;

}


angular.module('schemaForm').directive('modal', function () {

    // TODO: Add setting for class
    return {
        template: '<div class="modal fade">' +
        '<div class="{{ form.htmlClass ? form.htmlClass: \'modal-dialog\'}}">' +
        '<div class="modal-content" style="overflow:auto;">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" ng-click="parentController.toggleModal()" data-dismiss="modal" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title">{{ form.title }}</h4>' +
        '</div>' +
        '<div class="{{ form.fieldHtmlClass ? form.fieldHtmlClass: \'modal-body\'}} " ng-transclude></div>' +
        '</div>' +
        '</div>' +
        '</div>',
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: false,
        link: function postLink(scope: modalScope, element: JQuery, attrs: ng.IAttributes) {


            scope.$watch((<any>(attrs)).visible, function (value) {
                if (value == true)
                    (<any>$(element)).modal('show');
                else
                    (<any>$(element)).modal('hide');
            });

        }
    };
});


// Create a directive to properly access the ngModel set in the view (src/angular-schema-form-typescript.html)
angular.module('schemaForm').directive('complexUiDirective', (): ng.IDirective => {
    return {

        require: [],
        restrict: 'A',
        // Do not create a isolate scope, pass on
        scope: false,
        // Define a controller, use the function from above, inject the scope
        controller: ['$scope', ComplexUIController],
        link: function (scope: DirectiveScope, iElement, iAttrs, ngModelCtrl) {
            scope.parentController.getDefinitions();

        }
    }

});

angular.module('schemaForm').directive('script', (): ng.IDirective => {
    return {
        restrict: 'E',
        scope: false,
        link: function (scope: ng.IScope, elem: JQuery, attr: ng.IAttributes) {
            if (attr["type"] == 'text/javascript-lazy') {
                var s = document.createElement("script");
                s.type = "text/javascript";
                var src = elem.attr('src');
                if (src !== undefined) {
                    s.src = src;
                }
                else {
                    var code = elem.text();
                    s.text = code;
                }
                document.head.appendChild(s);
                elem.remove();

            }
        }
    };
});