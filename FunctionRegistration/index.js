var express = require('express');
var multer = require('multer');
var Docker = require('dockerode');
const { exec } = require('child_process');
const fs = require('fs');


var docker=Docker({
    protocol: 'https', //you can enforce a protocol
    host: '192.168.49.2',
    port: 2376,
    ca: fs.readFileSync('certs/ca.pem'),
    cert: fs.readFileSync('certs/cert.pem'),
    key: fs.readFileSync('certs/key.pem')
});
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
    const filePath = req.file.path;
    exec(`tar -xzf ${filePath} -C uploads/`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).send('Error decompressing the file');
            return;
        }
        if (stderr) {
            res.status(500).send('Error decompressing the file');
            return;
        }

        fs.unlink(filePath, (unlinkError) => {
            if (unlinkError) {
                console.error(`Error removing the file: ${unlinkError.message}`);
                res.status(500).send('Error removing the file');
                return;
            }
        });
        console.log("File decompressed successfully");
    });

    
    // docker.listContainers({all: true}, function(err, containers) {
    //     console.log('ALLLLLLLLLLLLL---->: ' + containers.length);
    //   });
      
    //   docker.listContainers({all: false}, function(err, containers) {
    //     console.log('!ALLLLLLLLLLLL---->: ' + containers.length);
    //   });
    
    res.status(202);
    res.send("file uploaded successfully");
    
});

app.get('/',(req,res)=>{
    console.log("helloworld requested");
    res.send("Hello world");
});

app.listen(8080,()=>{
    console.log("server started running \n");
});