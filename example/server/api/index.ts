
export default {
  'GET /api/test':(req: any, res: any)=>{
    res.json({data:'GET'})
  },
  'POST /api/test': (req: any, res: any) => {
    res.json({data:'POST'})
  },
  "/api/test":(req: any, res: any)=>{
    res.json({data:'all'})
  }
};
