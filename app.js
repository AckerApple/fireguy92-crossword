var slide = {}

var loadGame = function(){	
	angular.module('dadsGame',[])
	/*.config(['$anchorScrollProvider', function($anchorScrollProvider) {
		$anchorScrollProvider.disableAutoScrolling()
	}])*/
	.service('setup', () => maxBlocks) // loaded from GameBoard.class.js
	.service('memory',function(setup){
		var storage  = localStorage.getItem('dadsGame')
		if(!storage){
			storage = {}
		}else{
			try{
				storage = JSON.parse(storage)
			}catch(e){
				console.warn('game data has been lost',storage)
				storage = {}
			}
		}
		return {
			data:storage,
			clear:function(){
				this.data = {
					tabularData:[]
				}

				paramTabularData(this.data.tabularData, setup)

				this.save()
			},
			save:function(){
				this.data.updatedAt = new Date()
				var data = JSON.stringify(this.data)
				localStorage.setItem('dadsGame', data)
			},
			delayedSave:function(){
				setTimeout(this.save.bind(this), 1000)
			}
		}
	})
	.run(function($rootScope, memory){
		if(!memory.data.tabularData){
			memory.clear()
		}
	})
	.controller('GameBoard',GameBoard)
	.directive('gameBoard',function(){
		return {
			restrict:'E',templateUrl:'game-board',
			controller:'GameBoard as gameBoard'
		}
	})
	.directive('wellStage',function(){
		return {
			restrict:'E'
			,transclude:true
			,templateUrl:'well-stage'
		}
	})
	.directive('gameIntro',function(){
		return {
			restrict:'E'
			,templateUrl:'game-intro'
		}
	})
	.directive('gameTimeout',function(){
		return {
			restrict:'E'
			,templateUrl:'game-timeout'
			,require:'^gameBoard'
			,link:function($scope, jElm, attrs, gameBoard){
				setInterval(function(){
					if(gameBoard.path=='game-board'){
						gameBoard.path = 'game-timeout'	
						$scope.$digest()
						window.location='#game-timeout-area'
					}
				}, 300000);
			}
		}
	})

	.directive('crosswordTable',function(){
		return {
			restrict:'E',templateUrl:'crossword-table'
		}
	})
	.directive('gameWon',function(){
		return {
			restrict:'E'
			,templateUrl:'game-won'
		}
	})
	.directive('columnLetterBoxes',function(){
		return {
			restrict:'E'
			,scope:{gameBoard:'='}
			,templateUrl:'column-letter-boxes'
			,require:'^gameBoard'
			,link:function($scope, jElm, attrs, gameBoard){
				$scope.gameBoard = gameBoard
			}
		}
	})
	.directive('toolPanel',function(){
		return {
			restrict:'E',templateUrl:'tool-panel'
		}
	})
	.directive('letterSelector',function(){
		return {
			restrict:'E',
			scope:{model:'=', on:'&'},
			templateUrl:'letter-selector',
			controller:function($scope){
				$scope.go = function(){
					setTimeout(function(){
						$scope.on(); // this calls gameBoard.onKey via <letter-selector on="gameBoard.onKey()"></letter-selector>
						$scope.$parent.$digest()
					}, 100)
				}
			}
		}
	})
	.directive('debugColumn',function(){
		return {
			scope:{
				column:'='
			},
			restrict:'E',templateUrl:'debug-column'
			,require:'^gameBoard'
			,link:function($scope, jElm, attrs, gameBoard){
				$scope.gameBoard = gameBoard
			}
		}
	})
	.directive('debugPanel',function(){
		return {
			restrict:'E',templateUrl:'debug-panel'
		}
	})
	.directive('change',function(){
		return {
			restrict:'A'
			,link:function($scope, jElm, $attrs){
				jElm[0].onchange = function(){
					$scope.$eval($attrs.change)
				}
			}
		}
	})
	.directive('keyup',function(){
		return {
			restrict:'A'
			,link:function($scope, jElm, $attrs){
				jElm[0].onkeyup = function(){
					$scope.$eval($attrs.keyup)
				}
			}
		}
	})
	.directive('slide',function(){
		return {
			restrict:'A'
			,scope:{
				slidePlayEveryMs:'=', slideWatch:'&',
				slidePlayCount:'=', slideDirection:'@'//bf,lr,rl
			},
			transclude:true,
			link:function($scope, jElm, $attrs, required, transclude){
				if($scope.slidePlayEveryMs && !$scope.slidePlayCount){
					$scope.slidePlayCount = 1
				}
				$scope.cSlidePlayCount = $scope.slidePlayCount
				$scope.slideDirection = $scope.slideDirection || 'rl'
				slide.direction = 1
				slide.pos = $scope.slideDirection=='rl' ? -50 : 150
				slide.move = function(){
					$scope.$digest()
					if($scope.slideDirection=='rl'){
						var pos = slide.direction ? ++slide.pos : --slide.pos
					}else{
						var pos = slide.direction ? --slide.pos : ++slide.pos
					}
					jElm[0].style.right = pos+'%'
					if(slide.pos > 150 || slide.pos < -50){
						if($scope.cSlidePlayCount){
							--$scope.cSlidePlayCount
							if($scope.cSlidePlayCount==0){
								slide.stop()
								$scope.cSlidePlayCount = $scope.slidePlayCount
								if($scope.slidePlayEveryMs){
									setTimeout(slide.start.bind(this), $scope.slidePlayEveryMs)
								}
							}
						}
						switch($scope.slideDirection){
							case 'rl':
								slide.pos = -50
								break;
							case 'lr':
								slide.pos = 150
								break;

							default:slide.direction = slide.direction ? 0 : 1;
						}
					}
				}
				slide.start=function(){
					if ( slide.stop ) {
						slide.stop()
					}
	
					const value = $scope.slideWatch()
					if ( !value ) {
						return
					}
					slide.i = setInterval(slide.move.bind(this), 15);
				}
				slide.stop = function(){
					clearInterval(slide.i)
				}

				if($scope.slideWatch!=null){
					$scope.$watch($scope.slideWatch, slide.start.bind(slide))
				}else{
					slide.start()
				}

				transclude($scope, function(clone){
					jElm.html('')
					jElm.append(clone)
				})
			}
		}
	})
	.service('answerMap',function(){
		return [
			{
				value:"acker",
				hint:"The part of your name that is in most of your families name",
				posArray: [[3,3],[4,3],[5,3],[6,3],[7,3]], // acker
			},{
				value:"beth",
				hint:"The name of someone you married",
				posArray: [[12,0],[12,1],[12,2],[12,3]], // beth
			},{
				value:"goodrich",
				hint:"Someone you love has this maiden name",
				posArray: [[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12]], // goodrich
			},{
				value:"buster",
				hint:"He won't let go of a toy you throw",
				posArray: [[8,1],[9,1],[10,1],[11,1],[12,1],[13,1]], // buster
			},{
				value:"soxie",
				hint:"His feet are white and he loves to dive for rocks",
				posArray: [[18,4],[19,4],[20,4],[21,4],[22,4]], // soxie
			},{
				value:"squirtle",
				hint:"She has a favorite spot on her head and snores while awake",
				posArray: [[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5]], // squirtle
			},{
				value:"shawn",
				hint:"The name of your first favorite boy",
				posArray: [[11,3],[12,3],[13,3],[14,3],[15,3]],
			},{
				value:"nicholas",
				hint:"This person is named after Santa Claus",
				posArray: [[0,17],[1,17],[2,17],[3,17],[4,17],[5,17],[6,17],[7,17]],
			},{
				value:"santa",
				hint:"Type of jolly suit",
				posArray: [[13,7],[14,7],[15,7],[16,7],[17,7]],
			},{
				value:"coffee",
				hint:"Everyday. Often decorated on top",
				posArray: [[3,11],[4,11],[5,11],[6,11],[7,11],[8,11]],
			},{
				value:"chocolate",
				hint:"MMMMMMmmmmmmmmmmmmmmmmm it melts",
				posArray: [[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6]],
			},{
				value:"beetle",
				hint:"Had a spinning flower",
				posArray: [[6,2],[6,3],[6,4],[6,5],[6,6],[6,7]],
			},{
				value:"sunrise",
				hint:"You worked for the longest",
				posArray: [[9,0],[9,1],[9,2],[9,3],[9,4],[9,5],[9,6]],
			},{
				value:"florida",
				hint:"You lived here the longest",
				posArray: [[6,11],[6,12],[6,13],[6,14],[6,15],[6,16],[6,17]],
			},{
				value:"shelby",
				hint:"Type of Mustang Cobra. Makes grandkids.",
				posArray: [[14,10],[15,10],[16,10],[17,10],[18,10],[19,10]],
			},{
				value:"jordi",
				hint:"❤️s Lolo",
				posArray: [[12,11],[12,12],[12,13],[12,14],[12,15]],
			},{
				value:"computers",
				hint:"Everyone needs your help with",
				posArray: [[5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13]],
			},{
				value:"monopoly",
				hint:"🎲 You suck at this game because you're too good at it",
				posArray: [[19,3],[19,4],[19,5],[19,6],[19,7],[19,8],[19,9],[19,10]],
			},{
				value:"travis",
				hint:"🤠 Last name of the forever and ever amen man",
				posArray: [[14,5],[14,6],[14,7],[14,8],[14,9],[14,10]]
			}
		]

	})
}

function paramTabularData(tabularData, setup) {
	// build tabularData blanks
	for(var y=0; y < setup.vMaxBlocks; ++y){
		tabularData[y] = tabularData[y] || {id:y, columns:[]}
		tabularData[y].columns = tabularData[y].columns || []

		// param columns
		for(var x=0; x < setup.hMaxBlocks; ++x){
			tabularData[y].columns[x] = tabularData[y].columns[x] || {id:y+'-'+x, value:''}
		}		
	}

	return tabularData
}