const accessKey = document.getElementById('access-key');
const secretKey = document.getElementById('secret-key');
const region = document.getElementById('region');
const config = document.getElementById('config');
const textout = document.getElementById('text-out');
const tableout = document.getElementById('table-out');
var isDebug = (location.hostname === 'localhost');

function add_row(instanceID, state, publicIP) {
  let newRow = tableout.querySelector("tbody").insertRow(-1);
  let c0 = newRow.insertCell(0);
  let c1 = newRow.insertCell(1);
  let c2 = newRow.insertCell(2);
  let btn = document.createElement("button");
  c0.innerText = state;
  c1.innerText = publicIP;
  if (!(publicIP === undefined)) {
    btn.innerText = "Terminate";
    btn.setAttribute("data", instanceID);
    c2.appendChild(btn);
    btn.addEventListener("click", () => {stopService(instanceID);queryService();});
  }
}

function echo_time() {
  const timeout = document.getElementById('time-out');
  const d = Date();
  timeout.innerText = d.toString();
}

function saveCredential() {
  let ak = encodeURIComponent(accessKey.value);
  let sk = encodeURIComponent(secretKey.value);
  let cf = encodeURIComponent(config.value);
  document.cookie = `accessKey=${ak};SameSite=Strict;`;
  document.cookie = `secretKey=${sk};SameSite=Strict;`;
  document.cookie = `region=${region.value};SameSite=Strict;`;
  document.cookie = `config=${cf};SameSite=Strict;`;
}

function loadCredential() {
  const cookies = document.cookie.split("; ");
  cookies.forEach(cookie => {
    const [name, value] = cookie.split("=");
    if (name === "accessKey") {
      accessKey.value = decodeURIComponent(value);
    } else if (name === "secretKey") {
      secretKey.value = decodeURIComponent(value);
    } else if (name === "region") {
      region.value = value;
    } else if (name === "config") {
      config.value = decodeURIComponent(value);
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
  echo_time();

  ec2.runInstances(params, (err, data) => {
    if (err) {
      textout.innerText = err + '\n' + err.stack;
    } else {
      textout.innerText = JSON.stringify(data, null, 2);
      queryService();
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
        Name: 'tag:Name',
        Values: ['MyXrayServer*']
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
          add_row(instance.InstanceId, instance.State.Name, instance.PublicIpAddress);
        });
      });
      if (isDebug) {
        console.log(data.Reservations);
      }
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
if (accessKey.value.length > 0){
  queryService();
}
