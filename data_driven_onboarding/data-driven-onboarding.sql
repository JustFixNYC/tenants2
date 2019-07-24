-- zip code of building (pluto_18v2)
-- residential units in building (pluto_18v2) 
with Total_Res_Units as(
    select    
        zipcode,
        UnitsRes,
        bbl -- is this necessary?
    from pluto_18v2
    where bbl= 
%(bbl)s
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
        sum(unitsres) as NumberOfResUnitsinPortfolio
    from get_assoc_addrs_from_bbl(%(bbl)s)
    group by (Enteredbbl)
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
    where bbl= %(bbl)s and currentstatus !='VIOLATION CLOSED'
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
)

select
    -- zipcode for the entered bbl. 
    -- pulled from pluto_18v2. there are no null or instances of '0'. there are blanks?
    T.zipcode as zipcode, 

    -- number of residential units for entered bbl. 
    -- pulled from pluto_18v2. will return null if number of residential units (UnitsRes) is not listed in pluto_18v2
    -- will return 0 if there are 0 residential units according to pluto_18v2
    T.UnitsRes as unit_count, 

    -- number of hpd complaints for the entered bbl
    -- pulled from hpd complaints
    -- if there are no listed complaints for the specified bbl, will return null
    HPD.NumberOfHPDcomplaints as hpd_complaint_count,

    -- number of open hpd violations 
    -- pulled from hpd violations
    -- if there aren't any listed violations, will return null
    OpenHPD.NumberOfOpenHPDviolations as hpd_open_violation_count,

    -- number of associated buildings from portfolio
    -- drawn from function get_assoc_addrs_from_bbl
    -- will return null if value is unknown or if there are no associated buildings 
    A.NumberOfAssociatedBuildings as associated_building_count,

    -- number of residential units in portfolio
    -- drawn from function get_assoc_addrs_from_bbl
    -- will return null if value is unknown or if there are no associated buildings 
    A.NumberOfResUnitsinPortfolio as portfolio_unit_count,

    -- number of stabilized units at entered bbl in 2007
    -- drawn from rentstab_summary
    -- will not return null, will return 0
    coalesce(R.unitsstab2007,0) as stabilized_unit_count_2007,

    -- number of stabilized units at entered bbl in 2007
    -- drawn from rentstab_summary
    -- will not return null, will return 0
    coalesce(R.unitsstab2017,0) as stabilized_unit_count_2017,

    -- boolean, has this bbl ever had rent stabilized units
    -- true if it has had stabilized units at any point
    -- false if there have been no stabilized units at any point
    case 
        when (R.unitsstab2007=0 and R.unitsstab2017=0 and R.unitsstab2007 is null and R.unitsstab2017 is null) then false
        else true
    end as has_stabilized_units,

    -- average wait time for repairs after a landlord has been notified of a violation. for the entered bbl
    -- may return null if unknown
    W.AverageWaitTimeForRepairs as average_wait_time_for_repairs_at_bbl,

    -- average wait time for repairs after a landlord has been notified of a violation. for the the entire associated portfolio
    -- may return null if unknown
    P.AverageWaitTimeForPortfolio as average_wait_time_for_repairs_for_portfolio
from Total_Res_Units T
    left join Count_HPD HPD on T.bbl=HPD.bbl
    left join Count_Open_HPD OpenHPD on T.bbl=OpenHPD.bbl
    left join Count_Of_Assoc_Bldgs A on T.bbl= A.Enteredbbl
    left join public.rentstab_summary R on T.bbl= R.ucbbl
    left join Avg_Wait_Time W on T.bbl= W.bbl
    left join Avg_Wait_Time_For_Portfolio P on T.bbl= P.bbl
