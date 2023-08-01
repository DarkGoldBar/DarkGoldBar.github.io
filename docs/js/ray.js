const accessKey = document.getElementById('access-key');
const secretKey = document.getElementById('secret-key');
const region = document.getElementById('region');
const config = document.getElementById('config');
const textout = document.getElementById('text-out');
const tableout = document.getElementById('table-out');
const userdata = `#!/bin/bash
# Amazon Linux 2023
S3='s3://wdsrw'
WD='/data'
mkdir $WD $WD/xray $WD/log
yum install -y wget unzip awscli screen
wget https://github.com/XTLS/Xray-core/releases/download/v1.7.5/Xray-linux-64.zip -O /tmp/Xray-linux-64.zip
unzip /tmp/Xray-linux-64.zip -d $WD/xray
aws s3 sync $S3/ray $WD/ray
screen -dmS reserve $WD/xray/xray -c $WD/ray/reserve-server.json
screen -dmS proxy $WD/xray/xray -c $WD/ray/xray-server.json
`
const launch_config = {
  "MaxCount": 1,
  "MinCount": 1,
  "ImageId": "ami-08334eeab9e50ade9",
  "InstanceType": "t2.nano",
  "KeyName": "AWS-NE3",
  "UserData": btoa(userdata),
  "EbsOptimized": false,
  "IamInstanceProfile": {
    "Arn": "arn:aws:iam::493443340757:instance-profile/IAM-router"
  },
  "NetworkInterfaces": [
    {
      "DeviceIndex": 0,
      "AssociatePublicIpAddress": true,
      "Groups": [
        "sg-0e161b5404dcd09db"
      ]
    }
  ],
  "TagSpecifications": [
    {
      "ResourceType": "instance",
      "Tags": [
        {
          "Key": "Name",
          "Value": "router"
        }
      ]
    }
  ]
}

function add_row(instanceID, publicIP) {
  let newRow = tableout.insertRow(-1);
  let c0 = newRow.insertCell(0);
  let c1 = newRow.insertCell(1);
  let c2 = newRow.insertCell(2);
  let btn = document.createElement("button");
  c0.innerText = instanceID;
  c1.innerText = publicIP;
  btn.innerText = "STOP";
  c2.appendChild(btn);
  btn.addEventListener("click", () => {stopService(instanceID, publicIP)});
}

function echo_time() {
  const timeout = document.getElementById('time-out');
  const d = Date();
  timeout.innerText = d.toString();
}

function saveCredential() {
  document.cookie = `accessKey=${accessKey.value};`;
  document.cookie = `secretKey=${secretKey.value};`;
  document.cookie = `region=${region.value};`;
  document.cookie = `config=${config.value};`;
}

function loadCredential() {
  const cookies = document.cookie.split("; ");
  cookies.forEach(cookie => {
    const [name, value] = cookie.split("=");
    if (name === "accessKey") {
      accessKey.value = value;
    } else if (name === "secretKey") {
      secretKey.value = value;
    } else if (name === "region") {
      region.value = value;
    } else if (name === "config") {
      config.value = value;
    }
  });
}

function startService() {
  const credentials = new AWS.Credentials(accessKey.value, secretKey.value);
  const ec2 = new AWS.EC2({ 
    "credentials":credentials,
    "region":region.value 
  });
  const params = JSON.parse(config.value);
  textout.innerText = 'Starting service';

  ec2.runInstances(params, (err, data) => {
    if (err) {
      textout.innerText = err + '\n' + err.stack;
    } else {
      textout.innerText = JSON.stringify(data);
    }
  });
  echo_time();
}

function queryService() {
  const credentials = new AWS.Credentials(accessKey.value, secretKey.value);
  const ec2 = new AWS.EC2({ 
    "credentials":credentials,
    "region":region.value 
  });
  const params = {
    Filters: [
      {
        Name: 'instance-state-name',
        Values: ['running']
      }
    ]
  };
  
  tableout.querySelector("tbody").innerHTML = "";
  ec2.describeInstances(params, function(err, data) {
    if (err) {
      textout.innerText = err + '\n' + err.stack;
    } else {
      data.Reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          add_row(instance.InstanceId, instance.PublicIpAddress);
        });
      });
    }
  });
  echo_time();
}

function stopService(instanceID) {
  const credentials = new AWS.Credentials(accessKey.value, secretKey.value);
  const ec2 = new AWS.EC2({ 
    "credentials":credentials,
    "region":region.value 
  });

  const terminateParams = {
    InstanceIds: [instanceID]
  };
  
  ec2.terminateInstances(terminateParams, (err, data) => {
    if (err) {
      textout.innerText = err + '\n' + err.stack;
    } else {
      textout.innerText = JSON.stringify(data);
    }
  });
  echo_time();
}

echo_time();
loadCredential();
