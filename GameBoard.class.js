const maxBlocks = {
	hMaxBlocks : 23,
	vMaxBlocks : 23
}

function GameBoard(memory,answerMap, setup, $window, $scope){
	this.$scope = $scope
	this.setup = setup
	this.memory = memory
	this.answerMap = answerMap
	this.path = 'game-intro'
	this.zoom = 2

	this.answerCount=0

	this.selectedColumn = {
		id: '',
		value: '',
		answer: {
			value: '', hint: '', id: -1, posArray: [], complete: false,
		},
		answers: [],
		expect: '',
		expectPosIds: [-1, -1],
		posIds: [-1, -1]
	}

	/* answers populate missing positions */
		for(var x=0; x < answerMap.length; ++x){
			var answer = answerMap[x]
			answer.id = answer.id || x
			answer[x] = answer[x] = {}
			const posArray = answer[x].posArray = answer[x].posArray || []
			if( !posArray ){
				for(var letterIndex=0; letterIndex < answer.value.length; ++letterIndex){
					posArray.push([null, null])
				}
			}
		}
	/* end */

	$window.onkeydown = this.parseWindowKey.bind(this)
	// $window.onkeyup = this.parseWindowKey.bind(this)

	this.buildMatches()
}

GameBoard.prototype.parseWindowKey = function(event){
	if(this.path!='game-board')return

	var key = event.keyCode || event.which
	var keyAsc = String.fromCharCode(key).toLowerCase()
	
	// event.preventDefault() // just don't do anything automatic

	if(this.selectedColumn && this.selectedColumn.id){
		switch(key){
			case 8: // delete
				delete this.selectedColumn.value
				this.selectNextColumn(false)
				// this.onKey()
				this.checkState()
				this.$scope.$digest()
				return false // prevent back-space escaping window

			case 27://escape
				delete this.selectedColumn
				break

			default:
				if(keyAsc.search(/[a-z]/i)<0){
					return
				}

				this.selectedColumn.value = keyAsc
		}
		
		this.checkState()
		this.onKey()
	}
}

GameBoard.prototype.onKey = function(){
	if ( this.selectedColumn && this.selectedColumn.id ) {
		const answer = this.selectedColumn.answer
		answer.complete = this.isAnswerComplete(answer)
	}

	var isWon = this.isGameWon()
	if(isWon){
		return
	}else{
		const newColumn = this.selectNextColumn()
		
		// did we just jump to a new column? Focus it
		if ( newColumn === -1 ) {
			window.location = '#cell'+this.selectedColumn.id
		}
	}
	
	this.$scope.$digest()
}

/** returns if game is over */
GameBoard.prototype.checkState = function(){
	this.memory.save();
	var isWon = this.isGameWon()

	if(isWon){
		this.path = 'game-won'
		delete this.selectedColumn
		this.$scope.$digest()
		window.location = '#game-won-area'
		return true
	}
	return false
}

GameBoard.prototype.doColumnsMatchAnswers = function(columnA, columnB){
	var aAnswers = columnA.answers
	var bAnswers = columnB.answers

	for(var aIndex=aAnswers.length-1; aIndex >= 0; --aIndex){
		var answerA = aAnswers[aIndex]
		for(var bIndex=bAnswers.length-1; bIndex >= 0; --bIndex){
			if(bAnswers[bIndex].id == answerA.id){
				return true;
			}
		}
	}

	return false
}

GameBoard.prototype.getIncompleteAnswer = function(){
	for(var ansIndex=this.answerMap.length-1; ansIndex >= 0; --ansIndex){
		var answer = this.answerMap[ansIndex]
		answer.complete = this.isAnswerComplete(answer)
		if(this.isAnswerComplete(answer))continue;
		return answer
	}
}

GameBoard.prototype.isGameWon = function(){
	if ( this.getIncompleteAnswer() ) {
		return false
	}

	return true
}

GameBoard.prototype.getColumnByPosArray = function(posArray){
	if(!posArray || posArray[0]==null || posArray[1]==null)return
	var row = this.memory.data.tabularData[ posArray[0] ]
	return row.columns[ posArray[1] ]
}

GameBoard.prototype.isColumnInAnswer = function(column){
	const bad = !this.selectedColumn || !this.selectedColumn.id || !this.selectedColumn.answer
	if(bad)return false;

	for(var x=this.selectedColumn.answer.posArray.length-1; x >= 0; --x){
		var posArray = this.selectedColumn.answer.posArray[x];
		if(posArray[0]==column.posIds[0] && posArray[1]==column.posIds[1]){
			return true
		}
	}

	return false
}

/** return -1 means we went to a new answer */
GameBoard.prototype.selectNextColumn = function(isForward){
	if(!this.selectedColumn || !this.selectedColumn.id)return;

	// Select next answer
	if(this.selectedColumn.answer && this.isAnswerFull(this.selectedColumn.answer)){
		if(this.isAnswerComplete(this.selectedColumn.answer)){
			++this.answerCount;
			this.$scope.$digest()			
		}
		// this.selectNextAnswer()
	}	

	isForward = isForward==null? true : isForward
	var posIds = this.selectedColumn.posIds
	var posArray = this.selectedColumn.answer.posArray
	for(var x=0; x < posArray.length; ++x){
		var pos = posArray[x]
		if(pos[0]==posIds[0] && pos[1]==posIds[1]){//is current column
			if(isForward){
				if ( x+1 === posArray.length ) {
					this.selectNextAnswer(isForward)
					return -1
				} else {
					pos = posArray[x+1]
				}
			}else{
				if(x===0){
					// Below, removed: just stay in current box
					// this.selectNextAnswer(false)
					return
				} else {
					const newPos = x===1 ? 0 : x-1
					pos = posArray[newPos]
				}
			}

			var column = this.memory.data.tabularData[ pos[0] ].columns[ pos[1] ]
			this.selectColumn( column )
			return;
		}
	}
}

GameBoard.prototype.selectNextAnswer = function(isForward){
	isForward = isForward==null?true:isForward;
	let answer = this.selectedColumn.answer
	if(isForward){
		const isEnd = answer.id+1 < this.answerMap.length
		answer = this.answerMap[0]
		if ( isEnd ) {
			answer = this.getIncompleteAnswer()
		}

		const column = this.getFirstColumnByAnswer(answer)
		this.selectColumn( column )
	}else{
		if(answer.id>0){
			var newAnswer = this.answerMap[ answer.id-1 ]
			this.selectColumn( this.getFirstColumnByAnswer(newAnswer) )
		}else{
			this.selectColumn( this.getFirstColumnByAnswer(this.answerMap[this.answerMap.length-1]) )
		}
	}
}

GameBoard.prototype.getFirstColumnByAnswer = function(answer){
	for(var x=0; x < answer.posArray.length; ++x){
		var column = this.getColumnByPosArray( answer.posArray[x] )
		for(var aIndex=0; aIndex < column.answers.length; ++aIndex){
			var newAnswer = column.answers[aIndex]
			if(!this.isAnswerFull(newAnswer)){
				column = this.getColumnByPosArray( newAnswer.posArray[0] ) 
				column.answer = newAnswer
				return column
			}
		}
	}
	return this.getColumnByPosArray( answer.posArray[0] )
}

GameBoard.prototype.selectColumn = function(column){
	if(this.selectedColumn && this.selectedColumn.id){
		if(this.selectedColumn.id == column.id){//same column already selected		
			if(this.selectedColumn.answer && this.selectedColumn.answers.length>1){
				for(var x=this.selectedColumn.answers.length-1; x >= 0; --x){
					var answer = this.selectedColumn.answers[x]
					if(answer.id!=this.selectedColumn.answer.id){
						this.selectedColumn.answer = answer
						return this
					}
				}
			}
		}

		if(this.doColumnsMatchAnswers(column,this.selectedColumn)){
			column.answer = this.selectedColumn.answer
		}
	}
	
	if(column.expect || this.memory.data.isDebug){
		this.selectedColumn = column
	}
	/*
	if(this.selectedAnswer){
		for(var x=0; x < this.selectedAnswer.posArray.length; ++x){
			var def = this.selectedAnswer.posArray[x]
			if(def[0]==null && def[1]==null){
				def[0] = column.posIds[0]
				def[1] = column.posIds[1]
				break
			}
		}
	}

	this.selectedAnswer = column.answer || this.selectedAnswer;
	*/
}

GameBoard.prototype.restart = function(){
	this.memory.clear()
	this.buildMatches()
}

GameBoard.prototype.buildMatches = function(){
	if(this.memory.data.tabularData.length>this.setup.vMaxBlocks){
		this.memory.data.tabularData.length=this.setup.vMaxBlocks
	}
	
	paramTabularData(this.memory.data.tabularData, this.setup)
	for(var y=this.memory.data.tabularData.length-1; y >= 0; --y){
		var row = this.memory.data.tabularData[y]
		row.id = y
		if(row.columns.length > this.setup.hMaxBlocks){
			row.columns.length=this.setup.hMaxBlocks
		}

		for(var x=row.columns.length-1; x >= 0; --x){
			var column = row.columns[x]
			column.posIds = [y,x]
			column.id = y+'-'+x
			column.answers = this.getAnswersByColumn(column);
			delete column.expect
			delete column.answer
			delete column.expectPosIds
		}
	}

	for(var aIndex=0; aIndex < this.answerMap.length; ++aIndex){
		var answer = this.answerMap[aIndex]
		this.getAnswerMatches(answer)
		answer.complete = this.isAnswerComplete(answer)
	}
}

GameBoard.prototype.getAnswersByColumn = function(column){
	var posIds = column.posIds
	var answers = []
	for(var x=0; x < this.answerMap.length; ++x){
		var answer = this.answerMap[x]
		for(var posIndex=0; posIndex < answer.posArray.length; ++posIndex){
			var pos = answer.posArray[posIndex]
			if(pos[0]==posIds[0] && pos[1]==posIds[1]){
				answers.push(answer)
				break;
			}
		}
	}
	return answers
}

GameBoard.prototype.isAnswerFull = function(answer){
	if(!answer || !answer.posArray)return false
	for(var x=answer.posArray.length-1; x >= 0; --x){
		var posArray = answer.posArray[x]
		if(posArray[0]==null || posArray[1]==null)return false
		var row = this.memory.data.tabularData[posArray[0]]
		if(!row)return false;
		var column = row.columns[posArray[1]];
		if(!column || !column.value || !column.expect)return false
	}
	return true
}

GameBoard.prototype.isAnswerComplete = function(answer){
	if(!answer || !answer.posArray)return false
	for(var x=answer.posArray.length-1; x >= 0; --x){
		var posArray = answer.posArray[x]
		if(posArray[0]==null || posArray[1]==null)return false
		var row = this.memory.data.tabularData[posArray[0]]
		if(!row)return false;
		var column = row.columns[posArray[1]];
		if(!column || !column.value || !column.expect)return false
		if(column.value.toLowerCase()==column.expect.toLowerCase()){
			continue;
		}
		return false
	}
	return true
}

GameBoard.prototype.getAnswerMatches  = function(answer){
	answer.matches = []
	for(var pos=0; pos < answer.posArray.length; ++pos){
		var letter = answer.posArray[pos];
		var match = {
			expect:answer.value[pos]
		}

		if(letter[0]!=null && letter[1]!=null){
			match.start = letter[0];
			match.end = letter[1];
			var row = this.memory.data.tabularData[ letter[0] ];

			var columnMap = row.columns[ letter[1] ];
			columnMap.answer = answer
			columnMap.expect = match.expect
			columnMap.expectPosIds = [letter[0],letter[1]]
			match.value = columnMap ? columnMap.value : '?'

			if(pos==0){
				columnMap.cornerTitle = answer.id + 1
			}
		}
		answer.matches.push(match)
	}
}