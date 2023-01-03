select * from avustushaut where status <> 'deleted' order by to_date(content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') desc, id desc;
