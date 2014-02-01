(function() {

	window.template = function(id) {
		return _.template( $('#' + id).html() );
	};

	window.IpsumGenerator = {
		
		Models: {},
		Collections: {},
		Views: {},

		getRandomNumber: function(min, max) {
			return Math.round(Math.random() * (max - min) + min);
		}
	};

	IpsumGenerator.Models.Terms = Backbone.Model.extend({

		initialize: function() {
			this.latin = false;

			var that = this;

			$.when( this.getTerms('js/startup-terms.json'), this.getTerms('js/latin-terms.json') ).done(function(startup, ipsum) {
				that.startupTerms = startup[0].terms;
				that.latinTerms = ipsum[0].terms;
				that.terms = that.startupTerms;
			});
		},

		capitalize: function(term) {
			return term.charAt(0).toUpperCase() + term.slice(1);
		},

		getTerms: function(url) {
			return $.ajax({
				type: 'GET',
				url: url
			});
		},

		toggleLatin: function() {
			if (this.latin) {
				this.terms = this.startupTerms;
			} else {
				this.terms = this.startupTerms.concat(this.latinTerms);
			}
			this.latin = !this.latin;
		},

		getSentence: function() {
			var sentence = '',
				wordCount = IpsumGenerator.getRandomNumber(7, 14);

			for (var x = 0; x < wordCount; x++) {
				term = this.terms[IpsumGenerator.getRandomNumber(0, this.terms.length - 1 )];
				sentence += x === 0 ? this.capitalize(term) : term;
				sentence += x !== wordCount-1 ? ' ' : '.';
			}

			return sentence;
		},

		getParagraph: function() {
			var p = '',
				sentenceCount = IpsumGenerator.getRandomNumber(3, 5);

			for (var x = 0; x < sentenceCount; x++) {
				var sentence = this.getSentence();
				p += sentence;
				if ( x !== sentenceCount-1 ) p += ' ';
			}

			return p;
		}
	});

	IpsumGenerator.Views.IpsumText = Backbone.View.extend({
		
		el: 'body',
		latin: false,
		pCount: 5,
		pTags: false,
		paragraphTemplate: template('paragraphTemplate'),
		paragraphWithTagsTemplate: template('paragraphWithTagsTemplate'),

		initialize: function() {
			this.model = new IpsumGenerator.Models.Terms();
			this.renderHeaderIcon();
			this.bindBreakpoints();
		},

		events: {
			'submit form': 'render',
			'change #p-count': 'updatePCount',
			'change #p-tags': 'togglePTags',
			'change #latin': 'toggleLatin',
			'click #socialLinks a' : 'share'
		},

		bindBreakpoints: function() {
			var $window = $(window),
				$creators = $('#creators'),
				$socialLinks = $('#socialLinks');

			$window.setBreakpoints({
				distinct: true,
				breakpoints: [
					960
				] 
			});     

			$window.bind('enterBreakpoint960', function() {
				$creators.insertBefore($socialLinks);
			});

			$window.bind('exitBreakpoint960', function() {
				$creators.insertAfter($socialLinks);
			});
		},

		generate: function() {
			var paragraphs = [];

			for(var x = 0; x < this.pCount; x++) {
				paragraphs.push(this.model.getParagraph());
			}

			return paragraphs;
		},

		render: function(evt) {
			evt.preventDefault();
			
			var that = this,
				$startupIpsum = this.$el.find('#startup-ipsum'),
				$mainContent = this.$el.children('.mainContent'),
				content = {
					paragraphs: this.generate()
				};

			this.$el.find('.intro-copy').fadeOut(500, function() {
				if ( $startupIpsum.length === 0 ) {
					that.$el.find('button').html('Iterate!');
				} else {
					$startupIpsum.remove();
				}

				if (that.pTags) {
					$mainContent.prepend( that.paragraphWithTagsTemplate(content) ).find('#startup-ipsum').slideDown(800);
				} else {
					$mainContent.prepend( that.paragraphTemplate(content) ).find('#startup-ipsum').slideDown(800);
				}
			});

			return this;
		},

		renderHeaderIcon: function() {
			var imgNum = IpsumGenerator.getRandomNumber(1, 4),
				url = 'images/badge-' + imgNum + '.png';
			$('#logoBadge').attr('src', url);
		},

		share: function(evt) {
			evt.preventDefault();

			var url = evt.currentTarget.href;
			var newWindow = window.open(url,'name','height=440,width=540');
			if (window.focus) newWindow.focus();
		},

		toggleLatin: function() {
			this.model.toggleLatin();
			this.latin = !this.latin;
		},

		togglePTags: function() {
			this.pTags = !this.pTags;
		},

		updatePCount: function() {
			this.pCount = this.$el.find('#p-count').val();
		}
	});

	var ipsumTextView = new IpsumGenerator.Views.IpsumText();

})();