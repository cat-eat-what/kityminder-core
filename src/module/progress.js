define(function(require, exports, module) {
    var kity = require('../core/kity');
    var utils = require('../core/utils');

    var Minder = require('../core/minder');
    var MinderNode = require('../core/node');
    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');
    Module.register('ProgressModule', function() {
        var minder = this;

        var PROGRESS_DATA = 'progress';

        // Designed by Akikonata
        var BG_COLOR = '#FFFFFF';
        var PIE_COLOR = '#20a0ff';
        var SHADOW_PATH = 'M10,3c4.418,0,8,3.582,8,8h1c0-5.523-3.477-10-9-10S1,5.477,1,11h1C2,6.582,5.582,3,10,3z';
        var SHADOW_COLOR = '#8E8E8E';

        // jscs:disable maximumLineLength
        var FRAME_PATH = 'M0,0 L20,0 L20,20 L0,20 z';

        var FRAME_GRAD = new kity.LinearGradient().pipe(function(g) {
            g.setStartPosition(0, 0);
            g.setEndPosition(0, 1);
            g.addStop(0, '#fff');
            g.addStop(1, '#ccc');
        });
        var CHECK_PATH = 'M15.812,7.896l-6.75,6.75l-4.5-4.5L6.25,8.459l2.812,2.803l5.062-5.053L15.812,7.896z';
        var CHECK_COLOR = '#EEE';

        minder.getPaper().addResource(FRAME_GRAD);

        // 进度图标的图形
        var ProgressIcon = kity.createClass('ProgressIcon', {
            base: kity.Group,

            constructor: function(value) {
                this.callBase();
                this.setSize(14);
                this.create();
                this.setValue(value);
                this.setId(utils.uuid('node_progress'));
                this.translate(0.5, 0.5);
                this.control();
            },

            setSize: function(size) {
                this.width = this.height = size;
            },

            create: function() {

                var bg, pie, shadow, frame, check;

                bg = new kity.Rect()
                    .setRadius(4)
                    .setTranslate(-7, -7)
                    .setPosition(0, 0)
                    .setSize(14, 14)
                    .fill(BG_COLOR);

                pie = new kity.Rect()
                    .setRadius(4)
                    .setTranslate(-7, -7)
                    .setPosition(0, 0)
                    .setSize(14, 14)
                    .fill(PIE_COLOR);

                frame = new kity.Rect()
                    .setRadius(4)
                    .setTranslate(-7, -7)
                    .setPosition(0, 0)
                    .setSize(14, 14)
                    .stroke(PIE_COLOR);

                check = new kity.Path()
                    .setTranslate(-10, -10)
                    .setPathData(CHECK_PATH)
                    .fill(CHECK_COLOR);

                this.addShapes([bg, pie, check, frame]);
                this.pie = pie;
                this.check = check;
            },

            setValue: function(value) {
                if(value == 1){
                    this.pie.fill("#FFFFFF");
                }else if(value == 9){
                    this.pie.fill(PIE_COLOR);
                }
                this.check.setVisible(value == 9);
            },
            control: function() {
                var progress = this;
                this.on('click', function(e) {
                    minder.selectById([progress.container.minderNode.getData("id")], true);
                    if(progress.container.minderNode.data.progress==9){
                        progress.container.minderNode.setData("progress", 1);
                        progress.setValue(1);
                        if(progress.container!=null){
                            var _func = function(node){
                                if(node.getData("progress")!=1){
                                    node.setData("progress", 1);
                                    var _items = node.rc.getItems();
                                    for(var j in _items){
                                        if(_items[j].__KityClassName == 'ProgressIcon'){
                                            _items[j].setValue(1);
                                        }
                                    }
                                    for(var i in node.children){
                                        var _node = node.children[i];
                                        _func(_node);
                                    }
                                }
                            }
                            for(var i in progress.container.minderNode.children){
                                var _node = progress.container.minderNode.children[i];
                                _func(_node);
                            }
                        }
                    }else{
                        progress.container.minderNode.setData("progress", 9);
                        progress.setValue(9);
                        if(progress.container!=null){
                            var _func = function(node){
                                if(node.getData("progress")!=9){
                                    node.setData("progress", 9);
                                    var _items = node.rc.getItems();
                                    for(var j in _items){
                                        if(_items[j].__KityClassName == 'ProgressIcon'){
                                            _items[j].setValue(9);
                                        }
                                    }
                                    for(var i in node.children){
                                        var _node = node.children[i];
                                        _func(_node);
                                    }
                                }
                            }
                            for(var i in progress.container.minderNode.children){
                                var _node = progress.container.minderNode.children[i];
                                _func(_node);
                            }
                            var _func = function(node){
                                var _node = node.parent;
                                if(_node != null){
                                    if(_node.getData("progress")!=9){
                                        _node.setData("progress", 9);
                                        var _items = _node.rc.getItems();
                                        for(var i in _items){
                                            if(_items[i].__KityClassName == 'ProgressIcon'){
                                                _items[i].setValue(9);
                                            }
                                        }
                                    }
                                    if(_node.parent != null){
                                        _func(_node);
                                    }
                                }
                            }
                            _func(progress.container.minderNode);
                        }
                    }
                });
            },
        });

        /**
         * @command Progress
         * @description 设置节点的进度信息（添加一个进度小图标）
         * @param {number} value 要设置的进度
         *     取值为 0 移除进度信息；
         *     取值为 1 表示未开始；
         *     取值为 2 表示完成 1/8；
         *     取值为 3 表示完成 2/8；
         *     取值为 4 表示完成 3/8；
         *     其余类推，取值为 9 表示全部完成
         * @state
         *    0: 当前有选中的节点
         *   -1: 当前没有选中的节点
         */
        var ProgressCommand = kity.createClass('ProgressCommand', {
            base: Command,
            execute: function(km, value) {
                var nodes = km.getSelectedNodes();
                for (var i = 0; i < nodes.length; i++) {
                    nodes[i].setData(PROGRESS_DATA, value || null).render();
                }
                km.layout();
            },
            queryValue: function(km) {
                var nodes = km.getSelectedNodes();
                var val;
                for (var i = 0; i < nodes.length; i++) {
                    val = nodes[i].getData(PROGRESS_DATA);
                    if (val) break;
                }
                return val || null;
            },

            queryState: function(km) {
                return km.getSelectedNodes().length ? 0 : -1;
            }
        });

        return {
            'commands': {
                'progress': ProgressCommand
            },
            'renderers': {
                left: kity.createClass('ProgressRenderer', {
                    base: Renderer,

                    create: function(node) {
                        return new ProgressIcon();
                    },

                    shouldRender: function(node) {
                        return node.getData(PROGRESS_DATA);
                    },

                    update: function(icon, node, box) {
                        var data = node.getData(PROGRESS_DATA);
                        var spaceLeft = node.getStyle('space-left');
                        var x, y;

                        icon.setValue(data);

                        x = box.left - icon.width - spaceLeft;
                        y = -icon.height / 2;
                        icon.setTranslate(x + icon.width / 2, y + icon.height / 2);

                        return new kity.Box(x, y, icon.width, icon.height);
                    }
                })
            }
        };
    });
});