-- zip code of building (pluto_18v2)
-- residential units in building (pluto_18v2) 
with Total_Res_Units as(
    select    
        zipcode,
        case when yearbuilt = 0 then null else yearbuilt end,
        UnitsRes,
        bbl -- is this necessary?
    from pluto_18v2
    where bbl= %(bbl)s
    ),
    
-- sum of res units in associated portfolio (get_assoc_addrs_from_bbl)
-- count of buildings in associated portfolio (get_assoc_addrs_from_bbl) 
Count_Of_Assoc_Bldgs as (
    select    
        case 
            when bbl is not null then %(bbl)s
            else %(bbl)s
        end as Enteredbbl,
        count (*) filter (where bbl is not null) as NumberOfAssociatedBuildings,
        count (distinct zip) filter (where bbl is not null) as NumberOfAssociatedZips,
        sum(unitsres) as NumberOfResUnitsinPortfolio
    from get_assoc_addrs_from_bbl(%(bbl)s) 
    group by (Enteredbbl)
),

Major_Boro_Of_Assoc_Bldgs as (
    select    
        case 
            when bbl is not null then %(bbl)s
            else %(bbl)s
        end as Enteredbbl,
        boro,
        count(*) filter (where bbl is not null) NumberOfAssocBldgs
    from get_assoc_addrs_from_bbl(%(bbl)s) 
    group by (Enteredbbl, boro)
    order by NumberOfAssocBldgs desc
    limit 1
),

    
-- count of HPD complaints since 2014 in building (hpd_complaints)
-- count of all complaints closed and open
Count_HPD as (
    select
        bbl,
        count(*) filter (where complaintid is not null) as NumberOfHPDcomplaints
    from public.hpd_complaints
    where bbl= %(bbl)s and receiveddate > '2014-01-01'
    group by bbl
    
),

-- count of open HPD violations in building (hpd_violations)
Count_Open_HPD as (
    select
        bbl,
        count(*) filter (where violationid is not null) as NumberOfOpenHPDviolations
    from public.hpd_violations
    where bbl= %(bbl)s and violationstatus !='Close'
    group by bbl
),

Num_Days as (
select
    bbl,
    currentstatus,
    currentstatusdate-novissueddate as NumberOfDays
from hpd_violations
where currentstatus='VIOLATION CLOSED' and novissueddate > '2010-01-01'and bbl=%(bbl)s
),

Avg_Wait_Time as (
select    
    Num_Days.bbl as bbl,
    AVG(NumberOfDays) as AverageWaitTimeForRepairs
from Num_Days
group by bbl
),

violation_lengths_for_portfolio as(
    select
        case 
            when bbl is not null then %(bbl)s
            else %(bbl)s
        end as Enteredbbl,
        hpd_violations.currentstatusdate-hpd_violations.novissueddate as length_of_violation,
        currentstatus
    from 
        public.hpd_violations    
    where 
        currentstatus='VIOLATION CLOSED' and novissueddate >= '2010-01-01' and 
        bbl in (
            select
                bbl
            from 
                get_assoc_addrs_from_bbl(%(bbl)s)
        )
),

Avg_Wait_Time_For_Portfolio as(
    select
        enteredbbl as bbl,
        AVG(length_of_violation) as AverageWaitTimeForPortfolio
    from violation_lengths_for_portfolio
    group by Enteredbbl
),

Complaint_Category as(
    select
    	
        case 
            when majorcategory = 'UNSANITARY CONDITION' or majorcategory='GENERAL' then minorcategory
            else majorcategory end 
        as category,
        count(*) as NumberOfComplaints
    from public.hpd_complaint_problems as p
        left join public.hpd_complaints h on p.complaintid =h.complaintid
    where bbl= %(bbl)s
    group by category
    order by NumberOfComplaints desc
    limit 1
),

Complaint_Category_With_BBL as (
    select
        category,
        NumberOfComplaints,
        case 
            when category is not null then %(bbl)s
            else %(bbl)s
        end as bbl
    from Complaint_Category
),

Number_Of_2018_Evictions_For_Portfolio_Without_BBL as (
	select
		count(*) as NumberOfEvictions
	from public.marshal_evictions_18
	where bbl in (
            select
                bbl
            from 
                get_assoc_addrs_from_bbl(%(bbl)s)
        )
		
),

Number_Of_2018_Evictions_For_Portfolio as (
	select
		NumberOfEvictions,
		case 
            when NumberOfEvictions is not null then %(bbl)s
            else %(bbl)s
        end as bbl
      from Number_Of_2018_Evictions_For_Portfolio_Without_BBL
),

Number_Of_Class_C_Violations as (
	select
		bbl,
		count(*) filter (where class ='C') as ClassCTotal,
		count(*) filter (where currentstatus != 'VIOLATION CLOSED' and class='C') as ClassCOpenViolations
	from public.hpd_violations
	where bbl= %(bbl)s and novissueddate > '2010-01-01'
	group by bbl
),

Total_HPD_Violations as (
	select
		bbl,
		count(*) filter(where bbl is not null) as NumberOfViolations
	from public.hpd_violations
	where bbl= %(bbl)s and novissueddate > '2010-01-01'
	group by bbl
)



select
    -- zipcode for the entered bbl. 
    -- pulled from pluto_18v2. there are no null or instances of '0'. there are blanks?
    T.zipcode as zipcode, 
    
    -- year built for the entered bbl. 
    -- pulled from pluto_18v2. if the year built category is null or is '0', will return null
    T.yearbuilt as year_built, 

    -- number of residential units for entered bbl, from pluto_18v2
    -- will not return null, will return 0
    coalesce(T.UnitsRes,0) as unit_count, 

    -- number of hpd complaints for the entered bbl
    -- pulled from hpd complaints
    -- if there are no listed complaints for the specified bbl, will return null
    HPD.NumberOfHPDcomplaints as hpd_complaint_count,

    -- number of open hpd violations 
    -- pulled from hpd violations
    -- if there aren't any listed violations, will return null
    coalesce(OpenHPD.NumberOfOpenHPDviolations, 0) as hpd_open_violation_count,

    -- number of associated buildings from portfolio
    -- drawn from function get_assoc_addrs_from_bbl
    -- will return null if value is unknown or if there are no associated buildings 
    A.NumberOfAssociatedBuildings as associated_building_count,
    
    -- number of distinct zip codes of associated buildings from portfolio
    -- drawn from function get_assoc_addrs_from_bbl
    -- will return null if value is unknown or if there are no associated buildings 
    A.NumberOfAssociatedZips as associated_zip_count,

    -- number of residential units in portfolio
    -- drawn from function get_assoc_addrs_from_bbl
    -- will return null if value is unknown or if there are no associated buildings 
    A.NumberOfResUnitsinPortfolio as portfolio_unit_count,
    
    -- the most common borough for buildings in the portfolio
    -- drawn from function get_assoc_addrs_from_bbl
    -- will return null if value is unknown or if there are no associated buildings 
    MB.boro as portfolio_top_borough,
    
    -- the number of buildings in the portfolio's most common borough
    -- drawn from function get_assoc_addrs_from_bbl
    -- will return null if value is unknown or if there are no associated buildings 
    MB.NumberOfAssocBldgs as number_of_bldgs_in_portfolio_top_borough,

    -- number of stabilized units at entered bbl in 2007
    -- drawn from rentstab_summary
    -- will not return null, will return 0
    coalesce(R.unitsstab2007,0) as stabilized_unit_count_2007,

    -- number of stabilized units at entered bbl in 2007
    -- drawn from rentstab_summary
    -- will not return null, will return 0
    coalesce(R.unitsstab2017,0) as stabilized_unit_count_2017,

    -- maximum number of stabilized units at entered bbl on any year between 2007 and 2017
    -- false if there have been no stabilized units at any point
    -- will not return null, will return 0
    coalesce(R.unitstotal,0) as stabilized_unit_count_maximum,

    -- average wait time for repairs after a landlord has been notified of a violation. for the entered bbl
    -- may return null if unknown
    W.AverageWaitTimeForRepairs as average_wait_time_for_repairs_at_bbl,

    -- average wait time for repairs after a landlord has been notified of a violation. for the the entire associated portfolio
    -- may return null if unknown
    P.AverageWaitTimeForPortfolio as average_wait_time_for_repairs_for_portfolio,

    -- the most common category of HPD complaint
    MC.category as most_common_category_of_hpd_complaint,

    -- the number of complaints of the most common category
    MC.NumberOfComplaints as number_of_complaints_of_most_common_category,
    
    --number of hpd violations associated with entered bbl that are class c violations (since 2010)
    NV.ClassCTotal as number_of_class_c_violations,
    
    --number of total open violations associated with entered bbl (since 2010)
    NV.ClassCOpenViolations as number_of_open_violations,
    
    --total number of hpd violations for entered bbl (since 2010)
    THV.NumberOfViolations as number_of_total_hpd_violations
from Total_Res_Units T
    left join Count_HPD HPD on T.bbl=HPD.bbl
    left join Count_Open_HPD OpenHPD on T.bbl=OpenHPD.bbl
    left join Count_Of_Assoc_Bldgs A on T.bbl= A.Enteredbbl
    left join Major_Boro_Of_Assoc_Bldgs MB on T.bbl=MB.Enteredbbl
    left join public.rentstab_summary R on T.bbl=R.ucbbl
    left join Avg_Wait_Time W on T.bbl= W.bbl
    left join Avg_Wait_Time_For_Portfolio P on T.bbl= P.bbl
    left join Complaint_Category_With_BBL MC on T.bbl= MC.bbl
    left join Number_Of_Class_C_Violations NV on T.bbl = NV.bbl
	left join Total_HPD_Violations THV on T.bbl =THV.bbl