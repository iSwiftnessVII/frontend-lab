const API_BASE = (window as any).__env?.API_INSUMOS || 'http://localhost:3000/api/insumos';

export const insumosService = {
    async aux() {
        const res = await fetch(`${API_BASE}/aux`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    // Catálogo
    async buscarCatalogo(q: string, limit?: number, offset?: number) {
        const url = new URL(`${API_BASE}/catalogo`);
        if (q) url.searchParams.set('q', q);
        if (limit && limit > 0) url.searchParams.set('limit', String(limit));
        if (offset && offset > 0) url.searchParams.set('offset', String(offset));
        const res = await fetch(url);
        if (!res.ok) throw new Error(await res.text());
        return res.json(); // Puede ser array o {rows,total}
    },
    async obtenerCatalogo(item: number) {
        const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(String(item))}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async crearCatalogo(item: any) {
        const res = await fetch(`${API_BASE}/catalogo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        let data: any = null; try { data = await res.json(); } catch { }
        if (!res.ok) throw new Error((data && data.message) || 'Error creando catálogo');
        return data;
    },
    async actualizarCatalogo(itemId: number, item: any) {
        const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(String(itemId))}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        let data: any = null; try { data = await res.json(); } catch { }
        if (!res.ok) throw new Error((data && data.message) || 'Error actualizando catálogo');
        return data;
    },

    // Insumos
    async listarInsumos(q: string, limit?: number) {
        const url = new URL(API_BASE);
        if (q) url.searchParams.set('q', q);
        if (limit && limit > 0) url.searchParams.set('limit', String(limit));
        const res = await fetch(url);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async obtenerInsumo(item: number) {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(String(item))}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async crearInsumo(item: any) {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        let data: any = null; try { data = await res.json(); } catch { }
        if (!res.ok) throw new Error((data && data.message) || 'Error creando insumo');
        return data;
    },
    async actualizarInsumo(item: number, data: any) {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(String(item))}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        let resData: any = null; try { resData = await res.json(); } catch { }
        if (!res.ok) throw new Error((resData && resData.message) || 'Error actualizando insumo');
        return resData;
    },
    async eliminarInsumo(item: number) {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(String(item))}`, { method: 'DELETE' });
        let data: any = null; try { data = await res.json(); } catch { }
        if (!res.ok) throw new Error((data && data.message) || 'Error eliminando insumo');
        return data;
    },

 
}