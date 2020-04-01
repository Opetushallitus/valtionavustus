select * from avustushaut where status in (:statuses) order by to_date(content#>>'{duration,start}','yyyy-MM-ddTHH24:MI:SS.MS') desc, id desc;
