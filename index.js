const csv = require('csv-parser');
var mongo = require('mongodb');
var monk = require('monk');
const fs = require('fs');
var ProgressBar = require('progress');
const cliProgress = require('cli-progress');
var db = monk('mongodb://localhost:27017/phonesdata');
var tablename=Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
var foldername="datafiles";
try{
	db.collection(tablename).drop();
	db.collection(tablename).createIndex({ tel: 1 }, { unique: true });
}catch(e){}
const bars = [];
async function setItem(arr,id){
	if(!(arr.length>id)){
		console.log('[ DONE ]');
		return extractTable(tablename);
	}
	var file=arr[id];
	if(file.endsWith('.csv')){
				var results = [];
				console.log('\nscanning "'+file+'"');
				
				await fs.createReadStream(__dirname+'/'+foldername+'/'+file)
				  .pipe(csv({ separator: ';' }))
				  .on('data', (data) => results.push(data))
				  .on('end', async () => {
					var bar = new ProgressBar('=> [:bar] :percent :current/:total :etas', {
						complete: '█',
						incomplete: '░',
						width: 100,
						total: results.length
					});
					for(var i=0;i<results.length;i++){
						var item = results[i];
						if(item['Tel']!=""){
							await db.collection(tablename).insert({cp:""+item["Cp"],vil:item["Ville"],adrs:item["Adresse"],nom:item["Nom"],tel:''+((item['Tel'].startsWith('0'))?item['Tel']:'0'+item['Tel'])}).then(function (){
								
							}).catch(function (){
								
							});
						}
						bar.tick();
					}
					setItem(arr,id+1);
				  });
			}
}
async function extractTable(name){
	var filename_=Date.now()+'.csv';
	console.log('------  [  Creating Final File '+filename_+'  ]  ------');
	fs.appendFileSync(filename_, 'CP;Ville;Adresse;Nom;Tel;\n','utf8');
	db.collection(name).find({},{ fields: {_id:0} }).then(function (e){
		if(e!=null){
			var bar = new ProgressBar('=> [:bar] :percent :current/:total :etas', {
						complete: '█',
						incomplete: '░',
						width: 100,
						total: e.length
					});
			fs.appendFileSync(filename_, 'CP;Ville;Adresse;Nom;Tel;');
			for(var i=0;i<e.length;i++){
				var _item=e[i];
				fs.appendFileSync(filename_, _item.cp+';'+_item.vil+';'+_item.adrs+';'+_item.nom+';'+_item.tel+';\n','utf8');
				bar.tick();
			}
			console.log('File '+filename_+' has been created');
			console.log('-----------------------------------------------------------');
			db.close();
		}
	});
}
(async function (){
	fs.readdir(__dirname+'/'+foldername,async  function (err, files) {
		if (err) {
			return console.log('Unable to scan directory: ' + err);
		} 
		setItem(files,0);
	});
})();
