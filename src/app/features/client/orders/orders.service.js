"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientOrdersService = void 0;
const core_1 = require("@angular/core");
const http_1 = require("@angular/common/http");
let ClientOrdersService = (() => {
    let _classDecorators = [(0, core_1.Injectable)({ providedIn: 'root' })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ClientOrdersService = _classThis = class {
        constructor() {
            this.http = (0, core_1.inject)(http_1.HttpClient);
        }
        getServices() {
            return this.http.get('/api/services');
        }
        getMaterials(serviceTypeId) {
            const params = new http_1.HttpParams().set('serviceTypeId', serviceTypeId);
            return this.http.get('/api/materials', { params });
        }
        getMyOrders() {
            return this.http.get('/api/orders/my');
        }
        getOrderById(orderId) {
            return this.http.get(`/api/orders/${orderId}`);
        }
        createOrder(payload) {
            return this.http.post('/api/orders', payload);
        }
        normalizePricingModel(service) {
            const rawValue = service?.pricing_model ?? service?.pricingModel;
            const normalized = String(rawValue ?? '')
                .trim()
                .toUpperCase()
                .replace(/[\s-]+/g, '_');
            switch (normalized) {
                case 'FIXED':
                case 'FLAT':
                case 'FLAT_RATE':
                    return 'FIXED';
                case 'PER_UNIT':
                case 'UNIT':
                case 'BY_UNIT':
                    return 'PER_UNIT';
                case 'PER_AREA':
                case 'AREA':
                case 'PER_M2':
                case 'PER_SQUARE_METER':
                case 'SQUARE_METER':
                    return 'PER_AREA';
                case 'PER_LINEAR_METER':
                case 'LINEAR_METER':
                case 'PER_METER':
                case 'PER_METRE':
                case 'METER':
                case 'METRE':
                    return 'PER_LINEAR_METER';
                case 'PER_HOUR':
                case 'HOUR':
                case 'HOURLY':
                    return 'PER_HOUR';
                case 'PER_VOLUME':
                case 'VOLUME':
                case 'PER_M3':
                case 'PER_CUBIC_METER':
                case 'CUBIC_METER':
                    return 'PER_VOLUME';
                default:
                    return 'UNKNOWN';
            }
        }
        unwrapCollection(response) {
            if (!response) {
                return [];
            }
            if (Array.isArray(response)) {
                return response;
            }
            if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        }
        unwrapResource(response) {
            if (!response) {
                return null;
            }
            if (typeof response === 'object' && response !== null && 'data' in response) {
                return response.data ?? null;
            }
            return response;
        }
        getMaterialPrice(material) {
            const rawPrice = material?.price ?? material?.unit_price ?? material?.unitPrice;
            const parsed = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice ?? 0);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        getOrderEstimatedPrice(order) {
            const rawPrice = order?.estimated_price;
            const parsed = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice ?? 0);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        getPaymentAmount(payment) {
            const rawAmount = payment?.amount;
            const parsed = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount ?? 0);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        getOrderFiles(order) {
            return Array.isArray(order?.files) ? order.files : [];
        }
        getOrderPayments(order) {
            return Array.isArray(order?.payments) ? order.payments : [];
        }
        getFileUrl(file) {
            const url = file?.file_url ?? file?.fileUrl;
            return typeof url === 'string' ? url : '';
        }
        getFileType(file) {
            const type = file?.file_type ?? file?.fileType;
            return typeof type === 'string' ? type : 'Archivo';
        }
    };
    __setFunctionName(_classThis, "ClientOrdersService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ClientOrdersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ClientOrdersService = _classThis;
})();
exports.ClientOrdersService = ClientOrdersService;
