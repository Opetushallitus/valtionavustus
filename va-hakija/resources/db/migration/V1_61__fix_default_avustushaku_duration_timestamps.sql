update avustushaut ah set
content = jsonb_set(content, '{duration,start}', '"2015-08-19T05:00:00.000Z"')
where ah.id = 1 and content->'duration'->'start' = '"2015-08-19T08:00:00.000+03"';

update avustushaut ah set
content = jsonb_set(content, '{duration,end}', '"2015-09-30T13:15:00.000Z"')
where ah.id = 1 and content->'duration'->'end' = '"2015-09-30T16:15:00.000+03"';
