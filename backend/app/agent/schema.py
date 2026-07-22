"""结构化行程模型，对应 route_system.md 的「元数据密度」要求。"""
from typing import Literal, Optional

from pydantic import BaseModel, Field

NodeType = Literal["transport", "lodging", "activity"]


class ItineraryNode(BaseModel):
    """单个行程节点（交通 / 住宿 / 活动）。"""

    type: NodeType = Field(description="节点类型：transport=交通, lodging=住宿, activity=活动")
    name: str = Field(description="节点名称，如『外滩』『上海虹桥站』")
    day: int = Field(default=1, description="第几天（从 1 开始）")
    lng: Optional[float] = Field(default=None, description="经度（高德坐标系 GCJ-02）")
    lat: Optional[float] = Field(default=None, description="纬度（高德坐标系 GCJ-02）")
    start_time: Optional[str] = Field(default=None, description="开始时间，如『09:00』")
    end_time: Optional[str] = Field(default=None, description="结束时间，如『11:30』")
    booking_id: Optional[str] = Field(default=None, description="预约/票务 ID，可留空")
    protocol: Optional[str] = Field(default=None, description="协议/方式，如 DRIVING / METRO / HOTEL")
    notes: Optional[str] = Field(default=None, description="备注说明")
    image: Optional[str] = Field(
        default=None,
        description="该地点的真实照片 URL，取自高德 text_search 返回的 photo 字段；没有则留空，不要编造",
    )
    next_distance_km: Optional[float] = Field(
        default=None,
        description="到下一个 stop 节点的路线距离（公里），通过高德 distance 工具获取",
    )


class Itinerary(BaseModel):
    """一次完整的行程规划。"""

    title: str = Field(description="行程标题，如『上海周末 2 日游』")
    days: int = Field(default=1, description="总天数")
    cover_image: Optional[str] = Field(
        default=None,
        description="行程封面图 URL，从各景点的高德 photo 中挑一张代表性的；只用工具返回的真实 URL，不要编造",
    )
    nodes: list[ItineraryNode] = Field(default_factory=list, description="按时间排序的节点列表")
