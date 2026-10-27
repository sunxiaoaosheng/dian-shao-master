"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegionalBoard = getRegionalBoard;
/**
 * 地区厨子榜。
 * TODO(owner): 换成微信云开发或自建接口，按地区汇总招牌菜。
 * 现在返回本地示例，模块边界先留住，不要把名单写进界面文件。
 */
function getRegionalBoard() {
    return [
        { region: '川渝', chef: '油渣张', dish: '回锅肉', heat: 98 },
        { region: '岭南', chef: '煲仔李', dish: '煲仔饭', heat: 91 },
        { region: '江南', chef: '糖醋周', dish: '糖醋排骨', heat: 86 },
        { region: '西北', chef: '馍馍马', dish: '肉夹馍', heat: 84 },
        { region: '东北', chef: '铁锅赵', dish: '锅包肉', heat: 80 },
    ];
}
