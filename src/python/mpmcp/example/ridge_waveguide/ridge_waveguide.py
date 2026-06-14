import meep as mp
import numpy as np
import matplotlib.pyplot as plt

# ======== 1. 材料属性与波导几何结构 ========
TFLN_n = 2.21
SiO2_n = 1.45

total_thickness = 0.6       # TFLN 总厚度 600 nm（脊形区域）
etch_depth = 0.3            # 刻蚀深度 300 nm
slab_thickness = 0.3        # 刻蚀后剩余的平板厚度 = 0.3 um
ridge_height = total_thickness - etch_depth   # 脊高 = 0.3 um
ridge_width = 1.0           # 脊宽 = 1.0 um

# 仿真几何参数
cell_x = 8.0    # 传播方向长度
cell_y = 4.0    # 横向宽度
resolution = 30  # 像素/um


# ======== 2. 有效折射率法：垂直平板求解 ========
def solve_slab_te0(core_n, clad_n, thickness, wavelength):
    """
    求解对称平板波导 TE0 基模的有效折射率。

    对称平板波导的 TE 偶模特征方程为：
        V * sqrt(1 - b) = 2 * arctan(sqrt(b / (1 - b)))

    其中：
        V  = k0 * thickness * sqrt(n_core^2 - n_clad^2)
        b  = (n_eff^2 - n_clad^2) / (n_core^2 - n_clad^2)

    使用二分法求解 b，然后反算 n_eff。
    """
    k0 = 2 * np.pi / wavelength
    V = k0 * thickness * np.sqrt(core_n**2 - clad_n**2)

    def f(b):
        if b <= 0 or b >= 1:
            return np.inf
        return V * np.sqrt(1 - b) - 2 * np.arctan(np.sqrt(b / (1 - b)))

    b_lo, b_hi = 1e-6, 0.999999
    for _ in range(80):
        b_mid = (b_lo + b_hi) / 2
        if f(b_mid) * f(b_lo) > 0:
            b_lo = b_mid
        else:
            b_hi = b_mid

    b = (b_lo + b_hi) / 2
    n_eff = np.sqrt(b * (core_n**2 - clad_n**2) + clad_n**2)
    return n_eff


# ======== 3. 2D Meep 仿真：对单个波长计算脊形波导 n_eff ========
def simulate_n_eff(wavelength, verbose=False):
    """
    对给定的波长（um），使用有效折射率法 + 2D Meep 仿真，
    计算脊形波导基模的有效折射率。

    步骤：
      1. 计算垂直方向平板有效折射率 n_eff_ridge, n_eff_slab
      2. 在 XY 平面构建 2D 波导（n_eff_ridge 条带，n_eff_slab 背景）
      3. EigenModeSource 激发 + 模式分解提取 β
      4. n_eff = β / k0
    """
    frequency = 1.0 / wavelength

    # Step 1: 垂直方向平板有效折射率
    n_eff_ridge = solve_slab_te0(TFLN_n, SiO2_n, total_thickness, wavelength)
    n_eff_slab = solve_slab_te0(TFLN_n, SiO2_n, slab_thickness, wavelength)

    # Step 2: 构建 2D 仿真
    ridge_mat = mp.Medium(index=n_eff_ridge)
    slab_mat = mp.Medium(index=n_eff_slab)

    geometry = [
        mp.Block(
            center=mp.Vector3(0, 0),
            size=mp.Vector3(mp.inf, ridge_width, mp.inf),
            material=ridge_mat,
        ),
    ]

    sim = mp.Simulation(
        cell_size=mp.Vector3(cell_x, cell_y, 0),
        geometry=geometry,
        resolution=resolution,
        boundary_layers=[mp.PML(thickness=1.0)],
        default_material=slab_mat,
    )

    # Step 3: 激励源
    source_center = mp.Vector3(-cell_x / 2 + 1.0, 0)
    source_size = mp.Vector3(0, ridge_width * 2.0)

    eig_src = mp.EigenModeSource(
        src=mp.GaussianSource(frequency, fwidth=0.2 * frequency),
        center=source_center,
        size=source_size,
        direction=mp.X,
        eig_parity=mp.EVEN_Y,
        eig_match_freq=True,
        eig_resolution=resolution,
    )
    sim.sources = [eig_src]

    # 通量监视器
    flux_center = mp.Vector3(cell_x / 2 - 1.0, 0)
    flux_size = mp.Vector3(0, ridge_width * 2.0)

    flux = sim.add_flux(
        frequency,
        0,
        1,
        mp.FluxRegion(center=flux_center, size=flux_size),
    )

    # Step 4: 运行并提取模式
    sim.run(until_after_sources=mp.stop_when_fields_decayed(
        50, mp.Ez, source_center, 1e-6
    ))

    result = sim.get_eigenmode_coefficients(
        flux,
        bands=[1],
        eig_parity=mp.EVEN_Y,
        direction=mp.X,
    )

    kpoints = result.kpoints
    beta_meep = kpoints[0].x               # Meep 单位 (2π/μm)
    n_eff = beta_meep * wavelength          # n_eff = k·λ

    if verbose:
        print(f"  λ={wavelength:.4f} μm  "
              f"n_slab={n_eff_slab:.4f}  n_ridge={n_eff_ridge:.4f}  "
              f"n_eff={n_eff:.6f}")

    return n_eff


# ======== 4. 波长扫描 ========
# 在 1.55 μm 附近扫描，波长范围取 1.50 ~ 1.60 μm
# 点数足够多以保证数值微分的精度

wavelengths = np.linspace(1.50, 1.60, 21)  # 21 个波长点
n_eff_values = []

print("=== 波长扫描：脊形波导 n_eff ===")
for wl in wavelengths:
    n_eff = simulate_n_eff(wl, verbose=True)
    n_eff_values.append(n_eff)

n_eff_values = np.array(n_eff_values)

# ======== 5. 计算群折射率 ========
# 群折射率 ng = n_eff - λ * (dn_eff/dλ)
# 其中 dn_eff/dλ 使用 numpy 的二阶中心差分计算
#
# 等价的推导：
#   ng = c / vg
#   vg = dω/dβ
#   ng = c * dβ/dω = dβ/dk₀    (因为 k₀ = ω/c)
#   n_eff = β/k₀ = βλ/(2π)
#   所以 ng = n_eff - λ * dn_eff/dλ

dn_dlambda = np.gradient(n_eff_values, wavelengths)  # 数值微分
ng_values = n_eff_values - wavelengths * dn_dlambda   # 群折射率

print(f"\n=== 波长扫描结果 ===")
print(f"{'λ (μm)':>10s}  {'n_eff':>10s}  {'ng':>10s}")
print("-" * 34)
for wl, ne, ng in zip(wavelengths, n_eff_values, ng_values):
    print(f"{wl:10.4f}  {ne:10.6f}  {ng:10.6f}")

print(f"\n中心波长 λ=1.55 μm 处：")
center_idx = len(wavelengths) // 2
print(f"  有效折射率 n_eff = {n_eff_values[center_idx]:.6f}")
print(f"  群折射率   ng    = {ng_values[center_idx]:.6f}")

# ======== 6. 可视化 ========
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# 左图：n_eff 随波长变化
ax1.plot(wavelengths, n_eff_values, 'bo-', markersize=4, label='n_eff(λ)')
ax1.set_xlabel('Wavelength λ (μm)')
ax1.set_ylabel('Effective Index n_eff')
ax1.set_title('Effective Index vs Wavelength')
ax1.legend()
ax1.grid(True, alpha=0.3)

# 右图：ng 随波长变化
ax2.plot(wavelengths, ng_values, 'rs-', markersize=4, label='ng(λ)')
ax2.set_xlabel('Wavelength λ (μm)')
ax2.set_ylabel('Group Index ng')
ax2.set_title('Group Index vs Wavelength')
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("ridge_waveguide_dispersion.jpg", dpi=300, format='jpg')
print("\n图片已保存：ridge_waveguide_dispersion.jpg")
