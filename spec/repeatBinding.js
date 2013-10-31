describe('Binding: Repeat', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should repeat node for specified number of times and have access to index through $index', function() {
        testNode.innerHTML = "<span data-bind=\"repeat: {count: 5, bind: 'text: $index'}\"></span>";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText('01234');
    });

    it('Should repeat node and descendants for specified number of times and have access to index through $index', function() {
        testNode.innerHTML = "<div data-bind='repeat: 5'><span data-bind='text: $index'></span></div>";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText('01234');
    });

    it('Should not repeat any nodes (and not bind them) if the value is falsey', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItem, bind: \"text: someItem.nonExistentChildProp\"}'></span>";
        expect(testNode.childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: null }, testNode);
        expect(testNode).toContainText('');
        expect(testNode.childNodes.length).toBeGreaterThan(0);	// leaves placeholder comment node
        expect(testNode.childNodes[0].nodeType).toEqual(8);
    });

    it('Should duplicate node for each value in the array value (and have access to value through $item())', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: $item().childProp\"}'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('first childsecond child');
    });

    it('Should be able to specify sub-binding using a function with index', function() {
        testNode.innerHTML = "<span data-bind=\"repeat: {count: 5, bind: function($index) { return { text: $index }}}\"></span>";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText('01234');
    });

    it('Should be able to specify sub-binding using a function with item and index', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: function($item, $index) {return { text: $index + $item().childProp }}}'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('0first child1second child');
    });

    it('Should be able to specify sub-binding using a function on the view model and have access to the context', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: itemBinding }'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        var vm = {
            someItems: someItems,
            itemBinding: function($item, $index, context) {
                expect(this).toEqual(vm);
                expect(context.$data).toEqual(vm);
                return { text: $index + $item().childProp };
            }
        }
        ko.applyBindings(vm, testNode);
        expect(testNode).toContainText('0first child1second child');
    });

    it('Should be able to specify sub-binding using a data-repeat-bind attribute', function() {
        testNode.innerHTML = "<span data-bind='repeat: someItems' data-repeat-bind='text: $index + $item().childProp'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('0first child1second child');
    });

    it('Should be able to use \'with\' to create a child context', function() {
        testNode.innerHTML = "<div data-bind='repeat: {foreach: someItems, bind: \"with: $item\"}'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('first childsecond child');
        // add an item
        someItems.push({ childProp: 'last child' });
        expect(testNode).toContainText('first childsecond childlast child');
    });

    if (ko.version >= "3.0.0") {
        it('Should be able to use \'with\' to create a child context using function syntax', function() {
            testNode.innerHTML = "<div data-bind='repeat: {foreach: someItems, bind: function($item) { return { with: $item }}}'><span data-bind='text: childProp'></span></div>";
            var someItems = ko.observableArray([
                { childProp: 'first child' },
                { childProp: 'second child' }
            ]);
            ko.applyBindings({ someItems: someItems }, testNode);
            expect(testNode).toContainText('first childsecond child');
            // add an item
            someItems.push({ childProp: 'last child' });
            expect(testNode).toContainText('first childsecond childlast child');
        });

        it('Should be able to set item to \'$data\' to create a child context', function() {
            this.restoreAfter(ko.bindingHandlers.repeat, 'itemName');
            ko.bindingHandlers.repeat.itemName = '$data';
            testNode.innerHTML = "<div data-bind='repeat: someItems'><span data-bind='text: childProp'></span></div>";
            var someItems = ko.observableArray([
                { childProp: 'first child' },
                { childProp: 'second child' }
            ]);
            ko.applyBindings({ someItems: someItems }, testNode);
            expect(testNode).toContainText('first childsecond child');
            // add an item
            someItems.push({ childProp: 'last child' });
            expect(testNode).toContainText('first childsecond childlast child');
        });

        it('Should work with observable view models in Knockout 3.x', function() {
            testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, count: count}' data-repeat-bind='text: $item() || \"X\"'></span>";
            var someItems = ['A','B','C','D'], vm = ko.observable({someItems: [], count: 0});
            ko.applyBindings(vm, testNode);
            expect(testNode).toContainText('');
            // Change count using updated viewModel
            vm({someItems: someItems, count: 2});
            expect(testNode).toContainText('AB');
        });
    }

    it('Should be able to use $index to reference each array item being bound', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: someItems()[$index]\"}'></span>";
        var someItems = ko.observableArray(['alpha', 'beta']);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('alphabeta');
        // add an item
        someItems.push('gamma');
        expect(testNode).toContainText('alphabetagamma');
    });

    it('Should add and remove nodes to match changes in the bound array', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: $item().childProp\"}'></span>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('first childsecond child');

        // Add items at the beginning...
        someItems.unshift({ childProp: 'zeroth child' });
        expect(testNode).toContainText('zeroth childfirst childsecond child');

        // ... middle
        someItems.splice(2, 0, { childProp: 'middle child' });
        expect(testNode).toContainText('zeroth childfirst childmiddle childsecond child');

        // ... and end
        someItems.push({ childProp: 'last child' });
        expect(testNode).toContainText('zeroth childfirst childmiddle childsecond childlast child');

        // Also remove from beginning...
        someItems.shift();
        expect(testNode).toContainText('first childmiddle childsecond childlast child');

        // ... and middle
        someItems.splice(1, 1);
        expect(testNode).toContainText('first childsecond childlast child');

        // ... and end
        someItems.pop();
        expect(testNode).toContainText('first childsecond child');
    });

    it('Should update all nodes corresponding to a changed array item, even if they were generated via containerless templates', function() {
        testNode.innerHTML = "<div data-bind='repeat: someitems'><!-- ko if:true --><span data-bind='text: $item'></span><!-- /ko --></div>";
        var someitems = [ ko.observable('A'), ko.observable('B') ];
        ko.applyBindings({ someitems: someitems }, testNode);
        expect(testNode).toContainText('AB');

        // Now update an item
        someitems[0]('A2');
        expect(testNode).toContainText('A2B');
    });

    it('Should be able to update observable and non-observable items using a two-way binding', function() {
        var observableItem = ko.observable('C'), someItems = ['A','B',observableItem], skip = 0;

        testNode.innerHTML = "<input data-bind='repeat: someItems' data-repeat-bind='value: $item'/>";
        ko.applyBindings({someItems: someItems}, testNode);
        if (testNode.childNodes[0].nodeType == 8) {
            // When using Knockout 3.0, there will also be a leading comment
            skip = 1;
            expect(testNode).toHaveValues([undefined, 'A', 'B', 'C', undefined]);
        } else {
            // includes trailing 'undefined' for the comment that repeat inserts
            expect(testNode).toHaveValues(['A', 'B', 'C', undefined]);
        }

        // Update a value binding for a non-observable value and check that the array was updated
        testNode.childNodes[0+skip].value = 'X';
        ko.utils.triggerEvent(testNode.childNodes[0+skip], "change");
        expect(ko.toJS(someItems)).toEqual(['X','B','C']);

        // Update a value binding for the observable value and check that the observable was updated
        testNode.childNodes[2+skip].value = 'Z';
        ko.utils.triggerEvent(testNode.childNodes[2+skip], "change");
        expect(observableItem()).toEqual('Z');
        expect(ko.toJS(someItems)).toEqual(['X','B','Z']);
    });

    it('Should notify changes to an observable array when updating a item in the array', function() {
        var someItems = ko.observableArray(['A','B','C']), notifiedValues = [], beforeNotifiedValues = [], skip = 0;
        someItems.subscribe(function (value) {
            notifiedValues.push(value ? value.slice(0) : value);
        });
        someItems.subscribe(function (value) {
            beforeNotifiedValues.push(value ? value.slice(0) : value);
        }, null, "beforeChange");

        testNode.innerHTML = "<input data-bind='repeat: someItems' data-repeat-bind='value: $item'/>";
        ko.applyBindings({someItems: someItems}, testNode);
        if (testNode.childNodes[0].nodeType == 8) {
            // When using Knockout 3.0, there will also be a leading comment
            skip = 1;
            expect(testNode).toHaveValues([undefined, 'A', 'B', 'C', undefined]);
        } else {
            // includes trailing 'undefined' for the comment that repeat inserts
            expect(testNode).toHaveValues(['A', 'B', 'C', undefined]);
        }

        // update a value binding and check that the array was updated and notifications were posted
        testNode.childNodes[0+skip].value = 'X';
        ko.utils.triggerEvent(testNode.childNodes[0+skip], "change");
        expect(someItems()).toEqual(['X','B','C']);
        expect(notifiedValues).toEqual([['X','B','C']]);
        expect(beforeNotifiedValues).toEqual([['A','B','C']]);
    });

    it('Should be able to nest \'repeat\' and access binding contexts both during and after binding', function() {
        testNode.innerHTML = "<div data-bind='repeat: items'>"
                                + "<div data-bind='repeat: {foreach: $item().children, item: \"$child\"}'>"
                                    + "(Val: <span data-bind='text: $child'></span>)"
                                + "</div>"
                           + "</div>";
        var skip = 0, viewModel = {
            rootVal: 'ROOTVAL',
            items: ko.observableArray([
                { children: ko.observableArray(['A1', 'A2', 'A3']) },
                { children: ko.observableArray(['B1', 'B2']) }
            ])
        };
        ko.applyBindings(viewModel, testNode);
        if (testNode.childNodes[0].nodeType == 8) {
            // When using Knockout 3.0, there will also be a leading comment
            skip = 1;
        }

        // Verify we can access binding contexts during binding
        expect(testNode.childNodes[0+skip]).toContainText("(Val: A1)(Val: A2)(Val: A3)");
        expect(testNode.childNodes[1+skip]).toContainText("(Val: B1)(Val: B2)");

        // Verify we can access them later
        var firstInnerTextNode = testNode.childNodes[0+skip].childNodes[0+skip].childNodes[1];
        expect(firstInnerTextNode.nodeType).toEqual(1); // The first span associated with A1
        expect(ko.contextFor(firstInnerTextNode).$child()).toEqual("A1");
        expect(ko.contextFor(firstInnerTextNode).$root.rootVal).toEqual("ROOTVAL");
    });

    it('Should be able to use \'repeat\' in UL elements even when closing LI tags are omitted', function() {
        testNode.innerHTML =   "<ul><li>Header item<li data-bind='repeat: {foreach: someitems, bind: \"text: $item\"}'><li>Footer item</ul>";
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);

        expect(testNode).toContainText("Header itemAlphaBetaFooter item");
    });

    it('Should properly render nested observable arrays', function() {
        var innerArray1 = ko.observableArray(),
            outerArray = ko.observableArray([innerArray1]),
            vm = { outerArray: outerArray };
            updateItems = [];
        ko.bindingHandlers.test = {
            'update': function(element, valueAccessor) {
                var val = valueAccessor();
                element.innerHTML = val;
                updateItems.push(val);
            }
        }
        testNode.innerHTML = "<span data-bind='repeat: outerArray'><span data-bind='repeat: $item'><span data-bind='test: $item()'></span></span></span>";
        ko.applyBindings(vm, testNode);

        // initially nothing is output or bound
        expect(testNode).toContainText("");
        expect(updateItems.length).toEqual(0);

        // Add an item to the inner array
        updateItems = [];
        innerArray1.push('A');
        expect(testNode).toContainText("A");
        expect(updateItems).toEqual(['A']);

        // Add another item to the inner array
        updateItems = [];
        innerArray1.push('B');
        expect(testNode).toContainText("AB");
        expect(updateItems).toEqual(['A','B']);

        // Replace items in the inner array
        updateItems = [];
        innerArray1(['C', 'B', 'D', 'A']);
        expect(testNode).toContainText("CBDA");
        expect(updateItems).toEqual(['C', 'B', 'D', 'A']);

        // Insert a new array to the outer array
        updateItems = [];
        var innerArray2 = ko.observableArray(['X', 'Y']);
        outerArray.push(innerArray2)
        expect(testNode).toContainText("CBDAXY");
        expect(updateItems).toEqual(['C', 'B', 'D', 'A', 'X', 'Y']);
    });

    it('Should limit the number of displayed items if \'limit\' option is provided', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: $item()\", limit: limit}'></span>";
        var someItems = ['A','B','C','D'], limit = ko.observable(0);
        ko.applyBindings({ someItems: someItems, limit: limit }, testNode);
        // 0 limit means no limit
        expect(testNode).toContainText('ABCD');
        // limit larger than array has no effect
        limit(10);
        expect(testNode).toContainText('ABCD');
        // limit smaller than array size cuts off output
        limit(2);
        expect(testNode).toContainText('AB');
    });

    it('Should set the number of displayed items if \'count\' option is provided', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, count: fixedCount}' data-repeat-bind='text: $item() || \"X\"'></span>";
        var someItems = ['A','B','C','D'], fixedCount = ko.observable(0);
        ko.applyBindings({ someItems: someItems, fixedCount: fixedCount }, testNode);
        // 0 count means use array length
        expect(testNode).toContainText('ABCD');
        // count larger than array length outputs default items
        fixedCount(10);
        expect(testNode).toContainText('ABCDXXXXXX');
        // count smaller than array length cuts off output
        fixedCount(2);
        expect(testNode).toContainText('AB');
    });

    it('Should skip items if \'step\' option is provided', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, step: 2}' data-repeat-bind='text: $item()'></span>";
        var someItems = ['A','B','C','D'];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('AC');
    });

    it('Should output items in reversed order if \'reverse: true\' option is provided', function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, reverse: true}' data-repeat-bind='text: $index + $item()'></span>";
        var someItems = ko.observableArray(['A','B','C','D']);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('3D2C1B0A');
        // appended items are added to the beginning
        someItems.push('E');
        expect(testNode).toContainText('4E3D2C1B0A');
    });

    it('Should be able to specify numeric count using \'foreach\' option', function() {
        testNode.innerHTML = "<span data-bind=\"repeat: {foreach: 5, bind: 'text: $index'}\"></span>";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText('01234');
    });

    it('Should support a virtual element syntax', function() {
        testNode.innerHTML = "-<!--ko repeat: someItems--><span data-bind='text: $index + $item().childProp'></span><!--/ko-->-";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode).toContainText('-0first child1second child-');
        someItems.push({ childProp: 'third child' });
        expect(testNode).toContainText('-0first child1second child2third child-');
    });
});
