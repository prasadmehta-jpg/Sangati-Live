from app.agents.shift_commander import ShiftCommanderAgent
from app.agents.kitchen_flow import KitchenFlowAgent
from app.agents.floor_ops import FloorOpsAgent
from app.agents.inventory_procurement import InventoryProcurementAgent
from app.agents.staffing_labor import StaffingLaborAgent
from app.agents.compliance_quality import ComplianceQualityAgent
from app.agents.revenue_mix import RevenueMixAgent

AGENTS = [
    ShiftCommanderAgent(),
    KitchenFlowAgent(),
    FloorOpsAgent(),
    InventoryProcurementAgent(),
    StaffingLaborAgent(),
    ComplianceQualityAgent(),
    RevenueMixAgent(),
]
