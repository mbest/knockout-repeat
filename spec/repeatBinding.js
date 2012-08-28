function prepareTestNode() {
    var existingNode = document.getElementById("testNode");
    if (existingNode != null)
        existingNode.parentNode.removeChild(existingNode);
    testNode = document.createElement("div");
    testNode.id = "testNode";
    document.body.appendChild(testNode);
    ko.bindingHandlers.repeat.itemName = undefined;
}


describe('Binding: Repeat', {
    before_each: prepareTestNode,

    'Should repeat node for specified number of times and have access to index through $index': function() {
        testNode.innerHTML = "<span data-bind=\"repeat: {count: 5, bind: 'text: $index'}\"></span>";
        ko.applyBindings(null, testNode);
        value_of(testNode).should_contain_text('01234');
    },

    'Should repeat node and descendants for specified number of times and have access to index through $index': function() {
        testNode.innerHTML = "<div data-bind='repeat: 5'><span data-bind='text: $index'></span></div>";
        ko.applyBindings(null, testNode);
        value_of(testNode).should_contain_text('01234');
    },

    'Should not repeat any nodes (and not bind them) if the value is falsey': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItem, bind: \"text: someItem.nonExistentChildProp\"}'></span>";
        value_of(testNode.childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null }, testNode);
        value_of(testNode.childNodes.length).should_be(1);	// leaves placeholder comment node
        value_of(testNode.childNodes[0].nodeType).should_be(8);
    },

    'Should duplicate node for each value in the array value (and have access to value through $item())': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: $item().childProp\"}'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('first childsecond child');
    },

    'Should be able to specify sub-binding using a function with index': function() {
        testNode.innerHTML = "<span data-bind=\"repeat: {count: 5, bind: function($index) { return { text: $index }}}\"></span>";
        ko.applyBindings(null, testNode);
        value_of(testNode).should_contain_text('01234');
    },

    'Should be able to specify sub-binding using a function with item and index': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: function($item, $index) {return { text: $index + $item().childProp }}}'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('0first child1second child');
    },

    'Should be able to specify sub-binding using a function on the view model and have access to the context': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: itemBinding }'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        var vm = {
            someItems: someItems,
            itemBinding: function($item, $index, context) {
                value_of(this).should_be(vm);
                value_of(context.$data).should_be(vm);
                return { text: $index + $item().childProp };
            }
        }
        ko.applyBindings(vm, testNode);
        value_of(testNode).should_contain_text('0first child1second child');
    },

    'Should be able to specify sub-binding using a data-repeat-bind attribute': function() {
        testNode.innerHTML = "<span data-bind='repeat: someItems' data-repeat-bind='text: $index + $item().childProp'></span>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('0first child1second child');
    },

    'Should be able to use \'with\' to create a child context': function() {
        testNode.innerHTML = "<div data-bind='repeat: {foreach: someItems, bind: \"with: $item\"}'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('first childsecond child');
        // add an item
        someItems.push({ childProp: 'last child' });
        value_of(testNode).should_contain_text('first childsecond childlast child');
    },

    /* This currently doesn't work with the base Knockout because applyBindingsToNode returns an object
       with a minified property. See https://github.com/mbest/knockout-repeat/issues/6
       It does work with my smart-binding fork because it allows applyBindingsToNode to handle the
       child binding directly. */
    'Should be able to use \'with\' to create a child context using function syntax': function() {
        testNode.innerHTML = "<div data-bind='repeat: {foreach: someItems, bind: function($item) { return { with: $item }}}'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('first childsecond child');
        // add an item
        someItems.push({ childProp: 'last child' });
        value_of(testNode).should_contain_text('first childsecond childlast child');
    },

    'Should be able to set item to \'$data\' to create a child context (if supported)': function() {
        ko.bindingHandlers.repeat.itemName = '$data';
        testNode.innerHTML = "<div data-bind='repeat: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('first childsecond child');
        // add an item
        someItems.push({ childProp: 'last child' });
        value_of(testNode).should_contain_text('first childsecond childlast child');
    },

    'Should be able to use $index to reference each array item being bound': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: someItems()[$index]\"}'></span>";
        var someItems = ko.observableArray(['alpha', 'beta']);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('alphabeta');
        // add an item
        someItems.push('gamma');
        value_of(testNode).should_contain_text('alphabetagamma');
    },

    'Should add and remove nodes to match changes in the bound array': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: $item().childProp\"}'></span>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('first childsecond child');

        // Add items at the beginning...
        someItems.unshift({ childProp: 'zeroth child' });
        value_of(testNode).should_contain_text('zeroth childfirst childsecond child');

        // ... middle
        someItems.splice(2, 0, { childProp: 'middle child' });
        value_of(testNode).should_contain_text('zeroth childfirst childmiddle childsecond child');

        // ... and end
        someItems.push({ childProp: 'last child' });
        value_of(testNode).should_contain_text('zeroth childfirst childmiddle childsecond childlast child');

        // Also remove from beginning...
        someItems.shift();
        value_of(testNode).should_contain_text('first childmiddle childsecond childlast child');

        // ... and middle
        someItems.splice(1, 1);
        value_of(testNode).should_contain_text('first childsecond childlast child');

        // ... and end
        someItems.pop();
        value_of(testNode).should_contain_text('first childsecond child');
    },

    'Should update all nodes corresponding to a changed array item, even if they were generated via containerless templates': function() {
        testNode.innerHTML = "<div data-bind='repeat: someitems'><!-- ko if:true --><span data-bind='text: $item'></span><!-- /ko --></div>";
        var someitems = [ ko.observable('A'), ko.observable('B') ];
        ko.applyBindings({ someitems: someitems }, testNode);
        value_of(testNode).should_contain_text('AB');

        // Now update an item
        someitems[0]('A2');
        value_of(testNode).should_contain_text('A2B');
    },

    'Should be able to update observable and non-observable items using a two-way binding': function() {
        testNode.innerHTML = "<div data-bind='repeat: someitems'><input data-bind='value: $item' /></div>";
        var someitems = [ ko.observable('A'), 'B' ];
        ko.applyBindings({ someitems: someitems }, testNode);

        value_of(testNode.childNodes[0].childNodes[0].value).should_be('A');
        value_of(testNode.childNodes[1].childNodes[0].value).should_be('B');

        // Now update the value of the observable item through the input
        testNode.childNodes[0].childNodes[0].value = 'X';
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
        value_of(someitems[0]()).should_be('X');

        // and now the non-observable item
        testNode.childNodes[1].childNodes[0].value = 'Y';
        ko.utils.triggerEvent(testNode.childNodes[1].childNodes[0], "change");
        value_of(someitems[1]).should_be('Y');
    },

    'Should be able to nest \'repeat\' and access binding contexts both during and after binding': function() {
        testNode.innerHTML = "<div data-bind='repeat: items'>"
                                + "<div data-bind='repeat: {foreach: $item().children, item: \"$child\"}'>"
                                    + "(Val: <span data-bind='text: $child'></span>)"
                                + "</div>"
                           + "</div>";
        var viewModel = {
            rootVal: 'ROOTVAL',
            items: ko.observableArray([
                { children: ko.observableArray(['A1', 'A2', 'A3']) },
                { children: ko.observableArray(['B1', 'B2']) }
            ])
        };
        ko.applyBindings(viewModel, testNode);

        // Verify we can access binding contexts during binding
        value_of(testNode.childNodes[0]).should_contain_text("(Val: A1)(Val: A2)(Val: A3)");
        value_of(testNode.childNodes[1]).should_contain_text("(Val: B1)(Val: B2)");

        // Verify we can access them later
        var firstInnerTextNode = testNode.childNodes[0].childNodes[0].childNodes[1];
        value_of(firstInnerTextNode.nodeType).should_be(1); // The first span associated with A1
        value_of(ko.contextFor(firstInnerTextNode).$child()).should_be("A1");
        value_of(ko.contextFor(firstInnerTextNode).$root.rootVal).should_be("ROOTVAL");
    },

    'Should be able to use \'repeat\' in UL elements even when closing LI tags are omitted' : function() {
        testNode.innerHTML =   "<ul><li>Header item<li data-bind='repeat: {foreach: someitems, bind: \"text: $item\"}'><li>Footer item</ul>";
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);

        value_of(testNode).should_contain_text("Header itemAlphaBetaFooter item");
    },

    'Should properly render nested observable arrays': function() {
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
        value_of(testNode).should_contain_text("");
        value_of(updateItems.length).should_be(0);

        // Add an item to the inner array
        updateItems = [];
        innerArray1.push('A');
        value_of(testNode).should_contain_text("A");
        value_of(updateItems).should_be(['A']);

        // Add another item to the inner array
        updateItems = [];
        innerArray1.push('B');
        value_of(testNode).should_contain_text("AB");
        value_of(updateItems).should_be(['A','B']);

        // Replace items in the inner array
        updateItems = [];
        innerArray1(['C', 'B', 'D', 'A']);
        value_of(testNode).should_contain_text("CBDA");
        value_of(updateItems).should_be(['C', 'B', 'D', 'A']);

        // Insert a new array to the outer array
        updateItems = [];
        var innerArray2 = ko.observableArray(['X', 'Y']);
        outerArray.push(innerArray2)
        value_of(testNode).should_contain_text("CBDAXY");
        value_of(updateItems).should_be(['C', 'B', 'D', 'A', 'X', 'Y']);
    },

    'Should limit the number of displayed items if \'limit\' option is provided': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, bind: \"text: $item()\", limit: limit}'></span>";
        var someItems = ['A','B','C','D'], limit = ko.observable(0);
        ko.applyBindings({ someItems: someItems, limit: limit }, testNode);
        // 0 limit means no limit
        value_of(testNode).should_contain_text('ABCD');
        // limit larger than array has no effect
        limit(10);
        value_of(testNode).should_contain_text('ABCD');
        // limit smaller than array size cuts off output
        limit(2);
        value_of(testNode).should_contain_text('AB');
    },

    'Should set the number of displayed items if \'count\' option is provided': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, count: fixedCount}' data-repeat-bind='text: $item() || \"X\"'></span>";
        var someItems = ['A','B','C','D'], fixedCount = ko.observable(0);
        ko.applyBindings({ someItems: someItems, fixedCount: fixedCount }, testNode);
        // 0 count means use array length
        value_of(testNode).should_contain_text('ABCD');
        // count larger than array length outputs default items
        fixedCount(10);
        value_of(testNode).should_contain_text('ABCDXXXXXX');
        // count smaller than array length cuts off output
        fixedCount(2);
        value_of(testNode).should_contain_text('AB');
    },

    'Should skip items if \'step\' option is provided': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, step: 2}' data-repeat-bind='text: $item()'></span>";
        var someItems = ['A','B','C','D'];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('AC');
    },

    'Should output items in reversed order if \'reverse: true\' option is provided': function() {
        testNode.innerHTML = "<span data-bind='repeat: {foreach: someItems, reverse: true}' data-repeat-bind='text: $index + $item()'></span>";
        var someItems = ko.observableArray(['A','B','C','D']);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode).should_contain_text('3D2C1B0A');
        // appended items are added to the beginning
        someItems.push('E');
        value_of(testNode).should_contain_text('4E3D2C1B0A');
    }
});
