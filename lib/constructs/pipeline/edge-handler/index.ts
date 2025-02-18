export const handler = async (event: any) => {
  try {
    console.log("Event:", JSON.stringify(event, null, 2));
    const request = event.Records[0].cf.request;
    console.log("Original request:", JSON.stringify(request, null, 2));
    
    if (!request.uri.includes(".")) {
      request.uri = "/index.html";
      console.log("Modified request:", JSON.stringify(request, null, 2));
    }
    
    return request;
  } catch (error) {
    console.error("Error in edge function:", error);
    return {
      uri: "/index.html",
      method: "GET",
      querystring: "",
      headers: {},
      clientIp: "",
      body: undefined
    };
  }
}; 