var express = require("express");
var multer = require("multer");
var Docker = require("dockerode");
const k8s = require("@kubernetes/client-node");
const { v4: uuidv4 } = require("uuid");
const { CoreApi } = require("@kubernetes/client-node");
const client = new CoreApi();
const { exec } = require("child_process");

const fs = require("fs");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sApi2 = kc.makeApiClient(k8s.CoreV1Api);

var docker = Docker({
  protocol: "https", //you can enforce a protocol
  host: "192.168.49.2",
  port: 2376,
  ca: fs.readFileSync("certs/ca.pem"),
  cert: fs.readFileSync("certs/cert.pem"),
  key: fs.readFileSync("certs/key.pem"),
});
var app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, "code.tar.gz");
  },
});

const uploadstorage = multer({
  storage: storage,
  limits: {
    fileSize: 10000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(tar\.gz)$/)) {
      // upload only files with .tar.gz extension
      return cb(new Error("Please upload a .tar.gz file"));
    }
    cb(undefined, true);
  },
});

async function createService(uniqueid) {
  console.log("uniqueid-> " + uniqueid);
  const serviceManifest = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: uniqueid,
    },
    spec: {
      selector: {
        app: uniqueid,
      },
      type: "LoadBalancer",
      ports: [
        {
          protocol: "TCP",
          port: 8080,
          targetPort: 8080,
        },
      ],
    },
  };
  try {
    const response = await k8sApi2.createNamespacedService(
      "default",
      serviceManifest
    );
    console.log("Service created successfully:", response.body);
  } catch (error) {
    console.error("Error creating the service:", error);
  }
}

// async function createDeploymentAndService(uniqueid){
//   try {
//     const deployment = await k8sApi.createNamespacedDeployment('default', deploymentManifest);
//     console.log('Deployment created: ', deployment.body.metadata.name);

//     const service = await k8sApi.createNamespacedService('default', serviceManifest);
//     console.log('Service created: ', service.body.metadata.name);
// } catch (err) {
//     console.error('Error creating resources: ', err);
// }
// }

async function createDeployment(uniqueid) {
  const deploymentManifest = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: uniqueid,
    },
    spec: {
      replicas: 2,
      selector: {
        matchLabels: {
          app: uniqueid,
        },
      },
      template: {
        metadata: {
          labels: {
            app: uniqueid,
          },
        },
        spec: {
          containers: [
            {
              name: uniqueid,
              image: `${uniqueid}:4.0`,
              ports: [
                {
                  containerPort: 8080,
                },
              ],
            },
          ],
        },
      },
    },
  };
  try {
    const deployment = await k8sApi.createNamespacedDeployment(
      "default",
      deploymentManifest
    );
    console.log("Deployment created: ", deployment.body.metadata.name);
  } catch (err) {
    console.error("Error creating deployment: ", err);
    throw err;
  }
}

app.post(
  "/deploy",
  uploadstorage.single("code-compressed"),
  async (req, res) => {
    // checkAuth();
    if (!req.file) {
      console.log("file error");
      res.status(400);
      res.send("File not uploaded correctly");
    }
    console.log("file uploaded successfully");
    const filePath = req.file.path;
    exec(`tar -xzf ${filePath} -C uploads/`, (error, stdout, stderr) => {
      if (error) {
        res.status(500).send("Error decompressing the file");
        return;
      }
      if (stderr) {
        res.status(500).send("Error decompressing the file");
        return;
      }

      fs.unlink(filePath, (unlinkError) => {
        if (unlinkError) {
          console.error(`Error removing the file: ${unlinkError.message}`);
          res.status(500).send("Error removing the file");
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

    const uniqueid = "a" + uuidv4();
    const uploadsDirectory = __dirname + "/uploads";
    docker.buildImage(
      {
        context: uploadsDirectory,
        src: ["."],
        // src: ['Dockerfile','index.js','package.json','package-lock.json']
      },
      {
        t: uniqueid + ":4.0",
      },
      async function (error, output) {
        if (error) {
          return console.error(error);
        }
        output.pipe(process.stdout);
        await createDeployment(uniqueid);
        await createService(uniqueid);
      }
    );

    const namespace = "default";
    const serviceName = uniqueid;
    var nodePort;
    // Get the Service
    // k8sApi2
    //   .readNamespacedService(serviceName, namespace)
    //   .then((service) => {
    //     // Extract the NodePort
    //     nodePort = service.spec.ports.find((port) => port.nodePort !== null);
    //     if (nodePort) {
    //       console.log(
    //         `NodePort for Service ${serviceName}: ${nodePort.nodePort}`
    //       );
    //     } else {
    //       console.log(`NodePort not found for Service ${serviceName}`);
    //     }
    //   })
    //   .catch((err) => {
    //     console.error("Error:", err);
    //   });

    console.log("after build image");

    res.status(202);
    res.send(
      `file uploaded successfully`
    );
  }
);

app.get("/", (req, res) => {
  console.log("helloworld requested");
  res.send("Hello world");
});

app.listen(8080, () => {
  console.log("server started running \n");
});
