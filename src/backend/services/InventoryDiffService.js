const HardwareModel = require('../models/hardware.model');

class InventoryDiffService {
    /**
     * Procesa el inventario recibido del agente y detecta cambios
     * @param {number} equipoId 
     * @param {Object} payload Payload generado por systeminformation
     */
    static async processInventory(equipoId, payload) {
        const dbHardware = await HardwareModel.getHardwareGeneralByEquipo(equipoId);
        
        await this._processCpu(equipoId, dbHardware.cpu, payload.cpu);
        await this._processMotherboard(equipoId, dbHardware.motherboard, payload.motherboard);
        await this._processRam(equipoId, dbHardware.ram, payload.ram);
        await this._processGpu(equipoId, dbHardware.gpu, payload.gpu);
        await this._processDiscos(equipoId, dbHardware.discos, payload.discos);
        await this._processSoftware(equipoId, payload.software);
    }

    static async _processCpu(equipoId, dbCpu, payloadCpu) {
        if (!payloadCpu) return;

        const isDifferent = !dbCpu || dbCpu.modelo !== payloadCpu.modelo;
        
        if (isDifferent) {
            if (dbCpu) {
                await HardwareModel.logHardwareChange(equipoId, 'CPU', 'MODIFICADO', dbCpu, payloadCpu);
                await HardwareModel.deleteCpu(equipoId);
            } else {
                await HardwareModel.logHardwareChange(equipoId, 'CPU', 'AGREGADO', null, payloadCpu);
            }
            await HardwareModel.insertCpu({ equipo_id: equipoId, ...payloadCpu });
        }
    }

    static async _processMotherboard(equipoId, dbMb, payloadMb) {
        if (!payloadMb) return;

        const isDifferent = !dbMb || dbMb.modelo !== payloadMb.modelo || dbMb.bios_version !== payloadMb.bios_version;
        
        if (isDifferent) {
            if (dbMb) {
                await HardwareModel.logHardwareChange(equipoId, 'MOTHERBOARD', 'MODIFICADO', dbMb, payloadMb);
            } else {
                await HardwareModel.logHardwareChange(equipoId, 'MOTHERBOARD', 'AGREGADO', null, payloadMb);
            }
            await HardwareModel.insertMotherboard({ equipo_id: equipoId, ...payloadMb });
        }
    }

    static async _processRam(equipoId, dbRamArray, payloadRamArray) {
        if (!payloadRamArray) return;

        // Lógica simple de diff: comparamos suma total de capacidad o count de modulos
        const dbTotalCapacity = dbRamArray.reduce((acc, r) => acc + Number(r.capacidad_gb), 0);
        const payloadTotalCapacity = payloadRamArray.reduce((acc, r) => acc + Number(r.capacidad_gb), 0);

        if (dbTotalCapacity !== payloadTotalCapacity || dbRamArray.length !== payloadRamArray.length) {
            const action = payloadTotalCapacity > dbTotalCapacity ? 'AGREGADO' : (payloadTotalCapacity < dbTotalCapacity ? 'REMOVIDO' : 'MODIFICADO');
            
            // Si la db estaba vacía es AGREGADO
            if (dbRamArray.length === 0) {
                await HardwareModel.logHardwareChange(equipoId, 'RAM', 'AGREGADO', null, payloadRamArray);
            } else {
                await HardwareModel.logHardwareChange(equipoId, 'RAM', action, dbRamArray, payloadRamArray);
            }
            
            await HardwareModel.deleteRam(equipoId);
            await HardwareModel.insertRamBulk(equipoId, payloadRamArray);
        }
    }

    static async _processGpu(equipoId, dbGpuArray, payloadGpuArray) {
        if (!payloadGpuArray) return;

        const dbModels = dbGpuArray.map(g => g.modelo).sort().join(',');
        const payloadModels = payloadGpuArray.map(g => g.modelo).sort().join(',');

        if (dbModels !== payloadModels) {
            if (dbGpuArray.length === 0) {
                await HardwareModel.logHardwareChange(equipoId, 'GPU', 'AGREGADO', null, payloadGpuArray);
            } else {
                await HardwareModel.logHardwareChange(equipoId, 'GPU', 'MODIFICADO', dbGpuArray, payloadGpuArray);
            }
            await HardwareModel.deleteGpu(equipoId);
            await HardwareModel.insertGpuBulk(equipoId, payloadGpuArray);
        }
    }

    static async _processDiscos(equipoId, dbDiscosArray, payloadDiscosArray) {
        if (!payloadDiscosArray) return;

        const dbSerials = dbDiscosArray.map(d => d.numero_serie).sort().join(',');
        const payloadSerials = payloadDiscosArray.map(d => d.numero_serie).sort().join(',');

        if (dbSerials !== payloadSerials) {
            const action = payloadDiscosArray.length > dbDiscosArray.length ? 'AGREGADO' : (payloadDiscosArray.length < dbDiscosArray.length ? 'REMOVIDO' : 'MODIFICADO');
            
            if (dbDiscosArray.length === 0) {
                await HardwareModel.logHardwareChange(equipoId, 'DISCO', 'AGREGADO', null, payloadDiscosArray);
            } else {
                await HardwareModel.logHardwareChange(equipoId, 'DISCO', action, dbDiscosArray, payloadDiscosArray);
            }

            await HardwareModel.deleteDiscos(equipoId);
            await HardwareModel.insertDiscosBulk(equipoId, payloadDiscosArray);
        }
    }

    static async _processSoftware(equipoId, payloadSoftwareArray) {
        if (!payloadSoftwareArray) return;
        // El software es muy volatil, reconstruimos siempre el listado sin guardar historial minucioso (por ahora)
        await HardwareModel.deleteSoftware(equipoId);
        await HardwareModel.insertSoftwareBulk(equipoId, payloadSoftwareArray);
    }
}

module.exports = InventoryDiffService;
