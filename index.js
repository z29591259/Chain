var gameArea;
var matrixArea;
const MATRIX_WIDTH = 10;
const MATRIX_HEIGHT = 10;
var Matrix = [];
function onload(){
	gameArea = document.getElementById('game_area');
	matrixArea = document.getElementById('matrix_area');
	/*for (var i=0;i<MATRIX_WIDTH;i++) {
		Matrix[i] = [];
		for(var j=0;j<MATRIX_HEIGHT;j++){
			Matrix[i][j] = getRandom(1,5);
		}
	}
	console.log(Matrix);*/
	Matrix = 
		[[2, 3, 5, 3, 3, 2, 4, 1, 1, 5],
		[1, 1, 1, 1, 1, 1, 2, 3, 5, 1],
		[5, 1, 5, 5, 2, 4, 2, 5, 2, 5],
		[2, 1, 2, 1, 1, 5, 2, 1, 5, 2],
		[5, 1, 3, 4, 3, 3, 5, 1, 4, 1],
		[2, 5, 4, 4, 2, 5, 4, 4, 1, 3],
		[5, 2, 3, 2, 2, 1, 1, 5, 1, 2],
		[2, 2, 2, 2, 5, 1, 1, 1, 4, 1],
		[3, 3, 2, 3, 5, 1, 1, 5, 3, 1],
		[3, 3, 2, 4, 4, 1, 5, 1, 2, 3]];
	renderMatrix();
		
	document.querySelectorAll('.ball').forEach(x=>x.onmouseenter=function(e){
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		hintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x=>x.onmouseout=function(e){
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		unhintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x=>x.onclick=function(e){
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		removeBall(points);
		unhintBall(points);
	});
}

function renderMatrix(){
	var ball_html = '';
	for (var i=0;i<MATRIX_WIDTH;i++) {
    	for(var j=0;j<MATRIX_HEIGHT;j++){
        	ball_html += '<div class="ball" data-x="'+i+'" data-y="'+j+'" data-no="' + Matrix[i][j] + '" >'+i+','+j+'</div>';
	 	}
	}
	matrixArea.innerHTML = ball_html;
}

function removeBall(points){
	//將點位歸零
	for(var i=0;i<points.length;i++){
		setMatrixValue(points[i], 0);
	}
	
	for (var i=0;i<MATRIX_WIDTH;i++) {
		var row = Matrix[i].filter(function(item, index, array){
			return item != 0;
		});
		var changed = false;
		if(row.length == 0){
			//TODO 整行都是0，要移到最後一行
		}else{
			//若0的上面有顏色，讓他往下移動
			while(row.length < MATRIX_HEIGHT){
				row.unshift(0);
				changed = true;
			}
			if(changed){
				Matrix[i] = row;
				row.forEach((item, index)=>{
					//修改dom的data-no
					var p = document.querySelector(".ball[data-x='"+i+"'][data-y='"+index+"']");
					p.dataset['no'] = Matrix[i][index];
				})
			}
		}
	}
}
/**
* 分階段尋找，每次都找相鄰的點，一次一次擴散，並且比對不和之前的點重複，避免無窮迴圈
*/
function findTogetherBall(x,y){
	var value = getMatrixValue([x, y]);
	if(value == 0){return [];}
	var new_points = [[x,y]];
	var checked_points = [];
	
	while(new_points.length > 0){
		var handle_point = new_points.pop();
		var near_point = [];
		//左邊
		if(handle_point[0] > 0){
			near_point = [handle_point[0]-1, handle_point[1]]
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		//右邊
		if(handle_point[0] < MATRIX_WIDTH-1){
			near_point = [handle_point[0]+1, handle_point[1]]
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		//上面
		if(handle_point[1] > 0){
			near_point = [handle_point[0], handle_point[1]-1];
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		//下面
		if(handle_point[1] < MATRIX_HEIGHT-1){
			near_point = [handle_point[0], handle_point[1]+1];
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		if(!inArray(handle_point, checked_points)){
			checked_points.push(handle_point);
		}
	}
	if(checked_points.length == 1){
		checked_points.pop();
	}
	return checked_points;
}

function hintBall(points){
	points.forEach(x=>{
		var p = document.querySelector(".ball[data-x='"+x[0]+"'][data-y='"+x[1]+"']");
		if(p == null){
			console.log("null point: "+x[0]+","+x[1]);
		}else{
			p.classList.add('ball_clickable');
		}
	});
}

function unhintBall(points){
	points.forEach(x=>{
		var p = document.querySelector(".ball[data-x='"+x[0]+"'][data-y='"+x[1]+"']");
		if(p == null){
			console.log("null point: "+x[0]+","+x[1]);
		}else{
			p.classList.remove('ball_clickable');
		}
	});
}

function getMatrixValue(point){
	return Matrix[point[0]][point[1]];
}

function setMatrixValue(point, value){
	Matrix[point[0]][point[1]] = value;
}
/**
* item是否在positions陣列內
* @param object item
* @param object[] points
* 
* @return bool
*/
function inArray(item, points){
	return points.some(x=>x[0] == item[0] && x[1] == item[1]);
}
/**
* 產生min到max之間的亂數
* @param int min
* @param int max
* 
* @return int
*/
function getRandom(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
};