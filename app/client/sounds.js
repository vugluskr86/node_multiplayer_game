(function (root, factory) {
    'use strict';

    module.exports = factory(
        root,
        exports,
        require('underscore'),
        require('jquery'),
        require('backbone'),
        require('easeljs-loader!./libs/soundjs-0.6.2.combined.js')
    );

}(this, function (root, Module, _, $, Backbone) {
    'use strict';

    const SOUND_CONFIG = {
        "mobRemove" : "/ogg/remove.ogg",
        "mobAdd" : "/ogg/add.ogg",
        "mobUserRemove" : "/ogg/touch.ogg"
    };

    Module = {
        initialize : function(options) {
            _.bindAll(this, 'playSound');

            if( !options ) {
                this.options = SOUND_CONFIG;
            } else {
                this.options = options;
            }

            createjs.Sound.alternateExtensions = ["mp3"];

            Object.keys(this.options).forEach(function(soundId) {
                var soundUrl = this.options[soundId];
                createjs.Sound.registerSound({src:soundUrl, id:soundId});
            }.bind(this));
        },

        playSound : function(id) {
            createjs.Sound.play(id);
        }
    };

    return Module;
}));