var express = require('express');
var multer = require('multer');
var app=express();




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/")
    },
    filename: (req, file, cb) => {
      cb(null, "code.tar.gz");
    },
  })


const uploadstorage = multer({
    storage: storage,
    limits: {
      fileSize: 10000000 // 1000000 Bytes = 1 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(tar\.gz)$/)) { 
           // upload only files with .tar.gz extension
           return cb(new Error('Please upload a .tar.gz file'))
         }
       cb(undefined, true)
    }

    


}) 




app.post('/deploy',uploadstorage.single('code-compressed'),(req,res)=>{
    // checkAuth();
    if(!req.file){
        console.log("file error");
        res.status(400);
        res.send("File not uploaded correctly");
    }
    console.log("file uploaded successfully");
    res.status(202);
    res.send("file uploaded successfully");
});

app.get('/',(req,res)=>{
    res.send("Hello world");
});

app.listen(9001,()=>{
    console.log("server started running \n");
});