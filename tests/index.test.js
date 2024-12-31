const axios2 = require("axios");


const BACKEND_URL = "http://localhost:3000";
const WS_URL = "ws://localhost:3001";

const axios = {
  post: async (...args) => {
    try {
      const res = await axios2.post(...args);
      return res;
    } catch (e) {
      return e.response;
    }
  },
  get: async (...args) => {
    try {
      const res = await axios2.get(...args);
      return res;
    } catch (e) {
      return e.response;
    }
  },
  put: async (...args) => {
    try {
      const res = await axios2.put(...args);
      return res;
    } catch (e) {
      return e.response;
    }
  },
  delete: async (...args) => {
    try {
      const res = await axios2.delete(...args);
      return res;
    } catch (e) {
      return e.response;
    }
  },
};

describe("Authentication", () => {
  test("Authentication done only once", async () => {
    const username = "Akarsh" + Math.random();
    const password = "12334jh5";
    const res = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      // const res=await axios.post(`${BACKEND_URL}/health`,JSON.stringify({
      username,
      password,
      type: "admin",
    });
    
    expect(res.status).toBe(200);

    const res2 = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    
    expect(res2.status).toBe(400);
  });

  test("Authentication with wrong credentials", async () => {
    const username = "Something";
    const password = "12341212";

    const res = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      password,
    });
    expect(res.status).toBe(400);
  });

  test("During SignIn, userId doesnot get returned", async () => {
    const username = "Akarsh" + Math.random();
    const password = "12354212";

    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    expect(response.data.token).toBeDefined();
  });
});

describe("User metadata endpoints", () => {

  let token="";
  let userID="";
  let avatarID="";
  beforeAll(async()=>{

    const username=`akarsh-${Math.random()}`
    const password="123dgkjnjk";

    const signUpResponse=await axios.post(`${BACKEND_URL}/api/v1/signup`,{
      username,
      password,
      type:"admin"
    });

     userID=signUpResponse.data.userID;
    const signInResponse= await axios.post(`${BACKEND_URL}/api/v1/signin`,{
      username,
      password
    })

    token=signInResponse.data.token;
    const avatarResponse =await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`,{
      "imageUrl":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
      "name": "Timmy"
    },{
      headers:{
        "authorization" : `Bearer ${token}`
      }
    })
    
    avatarID=avatarResponse.data.avatarID;

  })

  test("Updating user metadata with right avatarID", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
      avatarID: avatarID,
    },{
      headers:{
        "authorization" : `Bearer ${token}`
      }
    });
    
 
    expect(res.status).toBe(200);
  });
  test("Updating user metadata with wrong avatarID", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
      avatarID: "34r98rubg",
    },{
      headers:{
        "authorization" : `Bearer ${token}`
      }
    });
    
    
    expect(res.status).toBe(400);
  });

  test("Updating user metadata without auth header",async()=>{
    const response=await axios.post(`${BACKEND_URL}/api/v1/user/metadata`,{
      avatarID
    })

    expect(response.status).toBe(403);
  })

  test("Getting all available avatars", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
    expect(res.data.avatars.length).not.toBe(0);
  });

  
});

describe("User avatar information",()=>{
  let userID1="",userID2="",userID3="";
  let token1="";
  let token2="";
  let token3="";
  const username1=`akarsh-${Math.random()}`;
  const username2=`akarsh-${Math.random()}`;
  const username3=`akarsh-${Math.random()}`;
  const password="1injnfidsjbg9";
  beforeAll(async()=>{
    const user1=await axios.post(`${BACKEND_URL}/api/v1/signup`,{
      username:username1,
      password:"1injnfisjbg9",
      type:"user"
    })
    userID1=user1.data.userID;

    const user2=await axios.post(`${BACKEND_URL}/api/v1/signup`,{
      username:username2,
      password:"1injnfidsjbg9",
      type:"user"
    })
    userID2=user2.data.userID;
    const user3=await axios.post(`${BACKEND_URL}/api/v1/signup`,{
      username:username3,
      password:"1injnfidsjbg9",
      type:"user"
    })
    userID3=user3.data.userID;

     token1=await axios.post(`${BACKEND_URL}/api/v1/signin`,{
      username:username1,
      password:"1injnfidsjbg9"
    })
     token2=await axios.post(`${BACKEND_URL}/api/v1/signin`,{
      username:username2,
      password:"1injnfidsjbg9"
    })
     token3=await axios.post(`${BACKEND_URL}/api/v1/signin`,{
      username:username3,
      password:"1injnfidsjbg9"
    })
    token1=token1.data.token
    token2=token2.data.token
    token3=token3.data.token
    
    const response=await axios.get(`${BACKEND_URL}/api/v1/avatars`);
    const avatarIds=response.data.avatars;
   
    await axios.post(`${BACKEND_URL}/api/v1/user/metadata`,{
      avatarID:avatarIds[0].avatarID
    },{
      headers:{
        "authorization":`Bearer ${token1}`
      }}

    )
    await axios.post(`${BACKEND_URL}/api/v1/user/metadata`,{
      avatarID:avatarIds[1].avatarID
    },{
      headers:{
        "authorization":`Bearer ${token2}`
      }}

    )
      await axios.post(`${BACKEND_URL}/api/v1/user/metadata`,{
      avatarID:avatarIds[2].avatarID
    },{
      headers:{
        "authorization":`Bearer ${token3}`
      }}

    )
  })
  test("Getting users data with correct userIDs", async () => {
    
   
    const ids = [userID1,userID2,userID3];
    const res = await axios.get(
      `${BACKEND_URL}/api/v1/user/metadata/bulk?ids=${ids}`
    );
    expect(res.data.avatars.length).not.toBe(0);
  });

  test("Getting users data  with incorrect userIDs", async () => {
   
    
    
    const ids = [1,2,3];
    const res = await axios.get(
      `${BACKEND_URL}/api/v1/user/metadata/bulk?ids=${ids}`
    );
    expect(res.data.avatars.length).toBe(0);
  });
})


describe("Space Queries", () => {

  let token="";
  let userID="";
  let mapID="";
  let element1Id="";
  let element2Id="";
  beforeAll(async()=>{

    const username=`akarsh-${Math.random()}`
    const password="123dgkjnjk";

    const signUpResponse=await axios.post(`${BACKEND_URL}/api/v1/signup`,{
      username,
      password,
      type:"admin"
    });

     userID=signUpResponse.data.userID;
    const signInResponse= await axios.post(`${BACKEND_URL}/api/v1/signin`,{
      username,
      password
    })

    // token=signInResponse.data.token;
    token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJjbTU3d3dwNDYwMDAzbHY5azR3YTVvMmh3Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM1Mzc1ODQ4fQ.VOqvWJFWHBF4dGGlwGtp_QESN2mM5u7yLdZ38XO3aEM";
    const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
      "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
      "width": 1,
      "height": 1,
    "static": true
  }, {
      headers: {
          authorization: `Bearer ${token}`
      }
  });

  const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
      "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
      "width": 1,
      "height": 1,
    "static": true
  }, {
      headers: {
          authorization: `Bearer ${token}`
      }
  })
  element1Id = element1Response.data.elementID
  element2Id = element2Response.data.elementID
  
    const mapCreation= await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
      thumbnail: "https://thumbnail.com/a.png",
   dimensions: "100x200",
   name: "100 person interview room 51",
   defaultElements: [{
		   elementID: element1Id,
		   x: 20,
		   y: 20
	   }, {
	     elementID: element2Id,
		   x: 18,
		   y: 20
	   }, {
	     elementID: element1Id,
		   x: 19,
		   y: 20
	   }, {
	     elementID: element2Id,
		   x: 19,
		   y: 20
	   }
   ]
    },{
      headers:{
        "authorization":`Bearer ${token}`
      }
    })
    
    mapID=mapCreation.data.mapID

  })


  test("Create a space without a Map", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/v1/space/create`, {
      name: "Test",
      dimensions: "100x200",
      
    },
  {
    headers:{
      "authorization":`Bearer ${token}`
    }
  });
    expect(res.status).toBe(200);
    expect(res.data.spaceID).toBeDefined;
  });
  test("Create a space from a Map", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/v1/space/create`, {
      name: "Created from Map 55",
      dimensions: "100x200",
      mapID: mapID,
    },
    {
      headers:{
        "authorization":`Bearer ${token}`
      }
    });
    
    expect(res.status).toBe(200);
    expect(res.data.message).toBe("Space created from Map");
    expect(res.data.spaceID).toBeDefined;
  });
  test("Create a space from a Map with wrong mapID fails", async () => {
    const res = await axios.post(`${BACKEND_URL}/api/v1/space/create`, {
      name: "Test",
      dimensions: "100x200",
      mapID: "9sdfj-",
    },
    {
      headers:{
        "authorization":`Bearer ${token}`
      }
    });
    expect(res.status).toBe(403);

  });
  test("Create a space without dimensions or name fails",async()=>{
    const res=await axios.post(`${BACKEND_URL}/api/v1/space/create`,{
      
      dimensions:"0x0"
    })

    expect(res.status).toBe(403);
  })

  test("Delete a space", async () => {

    const tempSpace=await axios.post(`${BACKEND_URL}/api/v1/space/create`, {
      name: "Test2",
      dimensions: "100x200",
    
    },
    {
      headers:{
        "authorization":`Bearer ${token}`
      }
    })
    const spaceID = tempSpace.data.spaceID;
    const res = await axios.delete(`${BACKEND_URL}/api/v1/space/:${spaceID}`,{
      headers:{
        "authorization":`Bearer ${token}`
      }
    });

    expect(res.status).toBe(200);
  });

  test("Get my existing spaces", async () => {
    const res = await axios.get(`${BACKEND_URL}/api/v1/space/all`,{
      headers:{
        "authorization":`Bearer ${token}`
            }
    });

    expect(res.status).toBe(200);
    expect(res.data.spaces.length).not.toBe(0);
  });
});

describe('HTTP tests', () => {
    test('Connection to the http server',async()=>{
        const res=await axios.get(`${BACKEND_URL}/api/v1/health`)
        
        expect(res.status).toBe(200);
    })
});

describe("Arena Endpoints",()=>{
    let element1Id="";
    let element2Id="";
    let mapID="";
    let spaceID="";
    let username=`kati-${Math.random()}`;
    let password=`fkjsnggsd-${Math.random()}`;
    let userToken="";
    let adminID="";
    let adminToken="";
    beforeAll(async()=>{
      const adminSignUpResponse=await axios.post(`${BACKEND_URL}/api/v1/signup`,{
        username,
        password,
        type:"admin"
      })

      adminID=adminSignUpResponse.data.userID;

      const adminSignInResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
        username,
        password
      })
      adminToken=adminSignInResponse.data.token;

      const userSignUpResponse= await axios.post(`${BACKEND_URL}/api/v1/signup`,{
        username:username+ "-user",
        password,
        type : "user"
      })
      userID=userSignUpResponse.data.userId;
      const userSignInResponse=await axios.post(`${BACKEND_URL}/api/v1/signin`,{
        username:username +"-user",
        password
      })
      userToken=userSignInResponse.data.token;

      const ele1=await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
        imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width:1,
        height:1,
        static:true
      },{headers:{
        "authorization":`Bearer ${adminToken}`
      }})
      element1Id=ele1.data.elementID;
      const ele2=await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
        imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width:1,
        height:1,
        static:true
      },{headers:{
        "authorization":`Bearer ${adminToken}`
      }})
      element2Id=ele2.data.elementID;
     
      const map=await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
        name:"Test3",
        dimensions: "1020x2000",
        thumbnail: "https://thumbnail.com/a.png",
        defaultElements: [{
          elementID: element1Id,
          x: 20,
          y: 20
        }, {
          elementID: element2Id,
          x: 18,
          y: 20
        }, {
          elementID: element1Id,
          x: 19,
          y: 20
        }
      ]
      },{
        headers:{
          "authorization":`Bearer ${adminToken}`
        }
      })
     
      mapID=map.data.mapID;
    
      const space =await axios.post(`${BACKEND_URL}/api/v1/space/create`,{
        name:"This is my space bruv",
        dimensions:"1010x3000",
        mapID:mapID
      },{
        headers:{
          "authorization":`Bearer ${userToken}`
        }
      })
      spaceID=space.data.spaceID;

    })

    test("Admin is able to create an Element",async()=>{
        const elementCreateResponse=await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
          imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
          width:1,
          height:1,
          static:true
        },{
          headers:{
            "authorization":`Bearer ${adminToken}`
          }
        })
       
        expect(elementCreateResponse.status).toBe(200);
    })
    test("Admin is not able to create an Element with wrong data",async()=>{
        const elementCreateResponse=await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
          imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
          width:1,
          height:"1",
          static:true
        },{
          headers:{
            "authorization":`Bearer ${adminToken}`
          }
        })
      
        expect(elementCreateResponse.status).toBe(400);
    })
    test("User is not able to create an Element",async()=>{

      const elementCreateResponse=await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
        imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width:"1",
        height:"1",
        static:"true"
      },{
        headers:{
          "authorization":`Bearer ${userToken}`
        }
      })
      expect(elementCreateResponse.status).toBe(403);
    })

    test("Incorrect spaceID returns 400",async()=>{
      const response=await axios.get(`${BACKEND_URL}/api/v1/space/12dsfs32`,{
        headers:{
          "authorization":`Bearer ${userToken}`
        }
      });

      expect(response.status).toBe(400);
    })

    test("Correct spaceID returns all the elements",async()=>{
      const response=await axios.get(`${BACKEND_URL}/api/v1/space/${spaceID}`,{
        headers:{ 
          "authorization":`Bearer ${adminToken}`
        }
      });
    
      expect(response.status).toBe(200);
      console.log(response.data)
      expect(response.data.elements.length).not.toBe(0);
    })
    test("Delete element with correct elementID",async()=>{
      const elements=await axios.get(`${BACKEND_URL}/api/v1/space/${spaceID}`,{
        headers:{ 
          "authorization":`Bearer ${adminToken}`
        }
      });
      const elementID=elements.data.elements[0].id;
      const response=await axios.delete(`${BACKEND_URL}/api/v1/space/element`,{
        data:{
          elementID
        },
        headers:{
          "authorization":`Bearer ${adminToken}`
        },
      })
      console.log(spaceID)
      console.log(elements.data.elements)
      console.log(elementID)
      console.log(response.data)
      expect(response.status).toBe(200);
      
    })

    test("Adding an element fails if it lies outside the dimensions",async()=>{

      const element =await axios.post(`${BACKEND_URL}/api/v1/space/element`,{
        elementID:element1Id,
        spaceID:spaceID,
        x:10000,
        y:10000
      },{
        headers:{
          "authorization":`Bearer ${userToken}`
        } 
      })
      expect(element.status).toBe(400);

    })
  

    
})

describe.skip('Websockets',()=>{

  let element1Id="";
  let element2Id="";
  let mapID="";
  let spaceID="";
  let username=`kati-${Math.random()}`;
  let password=`fkjsnggsd-${Math.random()}`;
  let userToken="";
  let adminID="";
  let adminToken="";
  let ws1;
  let ws2;
  let ws1Messages=[];
  let ws2Messages=[];
  let userX;
  let userY;
  let adminX;
  let adminY;

  async function waitForAndPopLatestMessage(messageArray) {
    return new Promise(resolve => {
        if (messageArray.length > 0) {
            resolve(messageArray.shift())
        } else {
            let interval = setInterval(() => {
                if (messageArray.length > 0) {
                    resolve(messageArray.shift())
                    clearInterval(interval)
                }
            }, 100)
        }
    })
  }
  async function HTTP_SETUP(){
    const adminSignUpResponse=await axios.post(`${BACKEND_URL}/api/v1/signup`,{
      username,
      password,
      type:"admin"
    })

    adminID=adminSignUpResponse.data.userID;

    const adminSignInResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
      username,
      password
    })
    adminToken=adminSignInResponse.data.token;

    const userSignUpResponse= await axios.post(`${BACKEND_URL}/api/v1/signup`,{
      username:username+ "-user",
      password,
      type : "user"
    })
    userID=userSignUpResponse.data.userId;
    const userSignInResponse=await axios.post(`${BACKEND_URL}/api/v1/signin`,{
      username:username +"-user",
      password
    })
    userToken=userSignInResponse.data.token;

    const ele1=await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
      imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
      width:"10",
      height:"13",
      static:"true"
    },{headers:{
      "authorization":`Bearer ${adminToken}`
    }})
    element1Id=ele1.data.elementID;
    const ele2=await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
      imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
      width:"12",
      height:"10",
      static:"true"
    },{headers:{
      "authorization":`Bearer ${adminToken}`
    }})
    element2Id=ele2.data.elementID;
   
    const map=await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
      name:"Test3",
      dimensions: "1520x2100",
      thumbnail: "https://thumbnail.com/a.png",
      defaultElements: [{
        elementID: element1Id,
        x: 2,
        y: 20
      }, {
        elementID: element2Id,
        x: 18,
        y: 90
      }, {
        elementID: element1Id,
        x: 59,
        y: 20
      }
    ]
    },{
      headers:{
        "authorization":`Bearer ${adminToken}`
      }
    })
   
    mapID=map.data.mapID;
  
    const space =await axios.post(`${BACKEND_URL}/api/v1/space/create`,{
      name:"This is my space bruv",
      dimensions:"1010x3000",
      mapID:mapID
    },{
      headers:{
        "authorization":`Bearer ${userToken}`
      }
    })
    spaceID=space.data.spaceID;

  }
  async function WS_SETUP(){
    ws1=new WebSocket(WS_URL);
    ws2=new WebSocket(WS_URL);

    await new Promise(r =>{
      ws1.onopen=r;
    })
    await new Promise(r=>{
      ws2.onopen=r;
    })

    ws1.onmessage=(msg)=>{
      ws1Messages.push(JSON.parse(msg.data));
    }
    ws2.onmessage=(msg)=>{
      ws2Messages.push(JSON.parse(msg.data));
    }
  
    
  }
  beforeAll(async()=>{
    HTTP_SETUP();
    WS_SETUP();
  })
  test("Get back acknowledgement on joining the space",async()=>{
    ws1.send(JSON.stringify({
     "type": "join",
      "payload": {
          "spaceID": spaceID,
          "token": adminToken
      }
    }))
    const response=await waitForAndPopLatestMessage(ws1Messages);
    expect(response.type).toBe("JOIN_SPACE_ACK");
  })
})
