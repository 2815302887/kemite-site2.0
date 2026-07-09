import math
import os


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_DIR = os.path.join(ROOT, "products", "models")
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    r"C:\Windows\Fonts\simsun.ttc",
]

PRODUCTS = [
    {
        "slug": "nc2528rl1-jar",
        "name": "NC2528RL1",
        "label_model": "NC-225R0L1",
        "kind": "solder",
        "alloy": "Sn63Pb37",
        "date": "2026-03-22",
        "batch": "G2026-PC03022",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.82, 0.86, 0.88, 1),
        "cap": (0.94, 0.95, 0.95, 1),
        "ink": (0.02, 0.02, 0.025, 1),
        "lead_free": False,
    },
    {
        "slug": "nc2623t3-jar",
        "name": "NC2623T3",
        "label_model": "NC-623T3-MA",
        "kind": "solder",
        "alloy": "Sn63Pb36.6Ag0.4",
        "date": "2026-03-22",
        "batch": "G2026-PC03022",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.82, 0.86, 0.88, 1),
        "cap": (0.94, 0.95, 0.95, 1),
        "ink": (0.02, 0.02, 0.025, 1),
        "lead_free": False,
    },
    {
        "slug": "nc3380rl1-front",
        "name": "NC3380RL1 Front",
        "label_model": "NC-388R0L1",
        "kind": "solder",
        "alloy": "SnAg3.0Cu0.5",
        "date": "2026-03-22",
        "batch": "G2026-PC03022",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.02, 0.38, 0.20, 1),
        "cap": (0.04, 0.45, 0.24, 1),
        "ink": (0.02, 0.32, 0.20, 1),
        "lead_free": True,
    },
    {
        "slug": "nc3380rl1-jar",
        "name": "NC3380RL1",
        "label_model": "NC-338R0L1",
        "kind": "solder",
        "alloy": "SnAg0.3Cu0.7",
        "date": "2026-03-21",
        "batch": "G2026-PC03021",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.02, 0.33, 0.17, 1),
        "cap": (0.04, 0.42, 0.20, 1),
        "ink": (0.02, 0.28, 0.18, 1),
        "lead_free": True,
    },
    {
        "slug": "nc3880rl1-jar",
        "name": "NC3880RL1",
        "label_model": "NC-388R0L1",
        "kind": "solder",
        "alloy": "SnAg1.0Cu0.5",
        "date": "2026-03-23",
        "batch": "G2026-PC03023",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.02, 0.48, 0.25, 1),
        "cap": (0.05, 0.58, 0.28, 1),
        "ink": (0.02, 0.34, 0.18, 1),
        "lead_free": True,
    },
    {
        "slug": "nc5280rl1-front",
        "name": "NC5280RL1 Front",
        "label_model": "NC-528R0L1",
        "kind": "solder",
        "alloy": "Sn64.7Bi35Ag0.3",
        "date": "2026-03-20",
        "batch": "G2026-PC03020",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.34, 0.78, 0.76, 1),
        "cap": (0.46, 0.86, 0.82, 1),
        "ink": (0.02, 0.35, 0.25, 1),
        "lead_free": True,
    },
    {
        "slug": "nc5280rl1-jar",
        "name": "NC5280RL1",
        "label_model": "NC-528R0L1",
        "kind": "solder",
        "alloy": "Sn42Bi58",
        "date": "2026-03-22",
        "batch": "G2026-PC02022",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.02, 0.70, 0.66, 1),
        "cap": (0.05, 0.80, 0.74, 1),
        "ink": (0.02, 0.36, 0.26, 1),
        "lead_free": True,
    },
    {
        "slug": "nc5280rl1-side",
        "name": "NC5280RL1 Side",
        "label_model": "NC-528R0L1",
        "kind": "solder",
        "alloy": "Sn64Bi35Ag1.0",
        "date": "2026-03-12",
        "batch": "G2026-PC03012",
        "weight": "500g",
        "shelf": "6M",
        "storage": "0-10C",
        "body": (0.08, 0.55, 0.50, 1),
        "cap": (0.16, 0.66, 0.60, 1),
        "ink": (0.02, 0.34, 0.24, 1),
        "lead_free": True,
    },
    {
        "slug": "smt-red-adhesive-label",
        "name": "SMT Red Adhesive Label",
        "label_model": "D856",
        "kind": "red_bottle",
        "alloy": "SMT adhesive",
        "date": "2026-03-22",
        "batch": "25090022",
        "weight": "300g",
        "shelf": "6M",
        "storage": "2-10C",
    },
    {
        "slug": "smt-red-adhesive-syringe",
        "name": "SMT Red Adhesive Syringe",
        "label_model": "D856",
        "kind": "red_syringe",
        "alloy": "SMT adhesive",
        "date": "2026-03-18",
        "batch": "25090018",
        "weight": "360g",
        "shelf": "6M",
        "storage": "2-10C",
    },
]


def ensure_dirs():
    os.makedirs(MODEL_DIR, exist_ok=True)


def clear_scene():
    import bpy

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.curves):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def principled(material):
    for node in material.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            return node
    return material.node_tree.nodes.new("ShaderNodeBsdfPrincipled")


def material(name, color, roughness=0.45, metallic=0.0, alpha=1.0):
    import bpy

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND" if alpha < 1 else "OPAQUE"
    mat.use_screen_refraction = alpha < 1
    bsdf = principled(mat)
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Alpha"].default_value = alpha
    return mat


def chinese_font():
    import bpy

    for font_path in FONT_CANDIDATES:
        if os.path.exists(font_path):
            return bpy.data.fonts.load(font_path)
    return None


def shade(obj):
    import bpy

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth()
    finally:
        obj.select_set(False)
    obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")
    return obj


def add_cylinder(name, radius, depth, loc, mat, vertices=96, rotation=(0, 0, 0)):
    import bpy

    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return shade(obj)


def add_cone(name, radius1, radius2, depth, loc, rot, mat):
    import bpy

    bpy.ops.mesh.primitive_cone_add(vertices=96, radius1=radius1, radius2=radius2, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return shade(obj)


def add_box(name, dimensions, loc, rot, mat, bevel=0.0):
    import bpy

    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("soft_edges", "BEVEL")
        mod.width = bevel
        mod.segments = 8
    return shade(obj)


def add_text(name, text, loc, size, mat, align="CENTER", rotation=(math.radians(90), 0, 0)):
    import bpy

    bpy.ops.object.text_add(location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.body = text
    font = chinese_font()
    if font:
        obj.data.font = font
    obj.data.align_x = align
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.003
    obj.data.resolution_u = 16
    obj.data.materials.append(mat)
    bpy.ops.object.convert(target="MESH")
    return shade(bpy.context.object)


def add_label_plate(name, width, height, y, z, mat, radius=0.035):
    return add_box(name, (width, 0.018, height), (0, y, z), (0, 0, 0), mat, radius)


def add_cap_ridges(radius, z, height, mat):
    for index in range(44):
        angle = (math.tau / 44) * index
        add_box(
            "cap_vertical_ridge",
            (0.032, 0.026, height),
            (math.cos(angle) * radius, math.sin(angle) * radius, z),
            (0, 0, angle),
            mat,
            0.003,
        )


def build_solder_jar(product):
    body_mat = material("jar_body", product["body"], 0.34, 0.0)
    cap_mat = material("jar_cap", product["cap"], 0.38, 0.0)
    shadow_mat = material("jar_shadow_detail", tuple(max(0.0, c * 0.62) for c in product["body"][:3]) + (1,), 0.46, 0.0)
    label_mat = material("matte_white_label", (0.96, 0.98, 0.96, 1), 0.56, 0.0)
    ink = material("label_ink", product["ink"], 0.48, 0.0)
    black = material("black_title_band", (0.02, 0.025, 0.03, 1), 0.5, 0.0)
    silver = material("thin_metal_edge", (0.74, 0.82, 0.84, 1), 0.24, 0.28)

    body_radius = 0.73
    add_cylinder("round_solder_paste_jar_body", body_radius, 1.34, (0, 0, -0.08), body_mat)
    add_cylinder("raised_bottom_ring", 0.75, 0.12, (0, 0, -0.79), shadow_mat)
    add_cylinder("screw_cap_main", 0.79, 0.34, (0, 0, 0.76), cap_mat)
    add_cylinder("cap_top_bevel", 0.71, 0.055, (0, 0, 0.96), silver)
    add_cylinder("recessed_cap_disk", 0.54, 0.065, (0, 0, 1.01), shadow_mat)
    add_cap_ridges(0.807, 0.76, 0.32, shadow_mat)

    label_y = -body_radius - 0.014
    text_y = -body_radius - 0.055
    add_label_plate("贴合圆柱体中文标签卡片", 1.16, 0.92, label_y, -0.1, label_mat, 0.038)
    add_box("标签标题色带", (0.92, 0.02, 0.14), (0, label_y - 0.024, 0.23), (0, 0, 0), black if not product["lead_free"] else ink, 0.018)
    add_text("标签标题_锡膏", "锡膏 SOLDER PASTE", (0, text_y, 0.235), 0.066, label_mat)
    if product["lead_free"]:
        add_text("标签认证_无铅", "RoHS  无铅", (0, text_y, 0.045), 0.062, ink)
    else:
        add_text("标签认证_有铅", "有铅制程", (0, text_y, 0.045), 0.058, ink)

    detail = (
        f"型号: {product['label_model']}\n"
        f"合金: {product['alloy']}\n"
        f"日期: {product['date']}\n"
        f"批号: {product['batch']}\n"
        f"净重: {product['weight']}  保期: {product['shelf']}\n"
        f"冷藏: {product['storage']}"
    )
    add_text("标签详情_中文", detail, (-0.48, text_y, -0.24), 0.043, ink, "LEFT")


def build_red_bottle(product):
    red = material("red_adhesive_plastic", (0.74, 0.06, 0.035, 1), 0.36, 0.0)
    dark_red = material("red_shadow_detail", (0.36, 0.015, 0.01, 1), 0.44, 0.0)
    green = material("green_label", (0.10, 0.42, 0.18, 1), 0.5, 0.0)
    yellow = material("yellow_warning_label", (0.94, 0.83, 0.12, 1), 0.5, 0.0)
    white = material("white_label_ink", (0.97, 0.98, 0.93, 1), 0.52, 0.0)
    black = material("black_warning_ink", (0.025, 0.025, 0.02, 1), 0.52, 0.0)

    add_cylinder("red_adhesive_bottle_body", 0.38, 1.72, (0, 0, -0.08), red)
    add_cone("rounded_bottle_shoulder", 0.38, 0.24, 0.32, (0, 0, 0.82), (0, 0, 0), red)
    add_cylinder("bottle_neck", 0.18, 0.34, (0, 0, 1.08), red)
    add_cylinder("bottle_cap", 0.24, 0.24, (0, 0, 1.32), red)
    add_cylinder("bottom_lip", 0.42, 0.08, (0, 0, -0.98), dark_red)
    add_cylinder("cap_lip", 0.27, 0.055, (0, 0, 1.18), dark_red)

    y = -0.392
    add_box("贴合瓶身绿色中文标签", (0.50, 0.018, 0.78), (-0.18, y, -0.16), (0, 0, 0), green, 0.024)
    add_box("贴合瓶身黄色警示卡片", (0.38, 0.02, 0.78), (0.28, y - 0.002, -0.16), (0, 0, 0), yellow, 0.024)
    add_text("红胶标题_中文", f"{product['label_model']} 红胶", (-0.39, y - 0.018, 0.12), 0.046, white, "LEFT")
    details = (
        f"贴片胶\n"
        f"日期: {product['date']}\n"
        f"批号: {product['batch']}\n"
        f"净重: {product['weight']}\n"
        f"保期: {product['shelf']}\n"
        f"冷藏: {product['storage']}"
    )
    add_text("红胶详情_中文", details, (-0.39, y - 0.018, -0.22), 0.035, white, "LEFT")
    add_text("警示文字_中文", "注意\n避免接触皮肤眼睛\nRoHS", (0.12, y - 0.021, -0.17), 0.034, black, "LEFT")


def build_red_syringe(product):
    red = material("red_syringe_body", (0.78, 0.055, 0.035, 1), 0.34, 0.0)
    dark_red = material("red_syringe_shadow", (0.36, 0.015, 0.01, 1), 0.44, 0.0)
    green = material("green_syringe_label", (0.11, 0.44, 0.20, 1), 0.5, 0.0)
    yellow = material("yellow_syringe_warning", (0.95, 0.82, 0.10, 1), 0.5, 0.0)
    white = material("white_syringe_ink", (0.98, 0.98, 0.94, 1), 0.52, 0.0)
    black = material("black_syringe_ink", (0.025, 0.025, 0.02, 1), 0.52, 0.0)

    add_cylinder("vertical_red_syringe_cartridge", 0.27, 2.2, (0, 0, -0.02), red)
    add_cylinder("top_stop_cap", 0.24, 0.20, (0, 0, 1.18), red)
    add_cylinder("top_button", 0.17, 0.22, (0, 0, 1.39), red)
    add_cylinder("bottom_round_lip", 0.31, 0.075, (0, 0, -1.16), dark_red)

    y = -0.285
    add_box("针筒贴合绿色中文标签", (0.42, 0.018, 0.82), (0.05, y, -0.12), (0, 0, 0), green, 0.024)
    add_box("针筒贴合黄色警示卡片", (0.18, 0.02, 0.82), (-0.25, y - 0.002, -0.12), (0, 0, 0), yellow, 0.024)
    add_text("针筒标题_中文", f"{product['label_model']} 红胶", (-0.13, y - 0.019, 0.17), 0.04, white, "LEFT")
    details = (
        f"贴片胶\n"
        f"日期: {product['date']}\n"
        f"批号: {product['batch']}\n"
        f"净重: {product['weight']}\n"
        f"保期: {product['shelf']}\n"
        f"冷藏: {product['storage']}"
    )
    add_text("针筒详情_中文", details, (-0.13, y - 0.019, -0.20), 0.03, black, "LEFT")


def add_lighting_and_camera():
    import bpy
    from mathutils import Vector

    bpy.ops.object.light_add(type="AREA", location=(-2.8, -3.4, 4.3))
    key = bpy.context.object
    key.name = "large_softbox_key"
    key.data.energy = 480
    key.data.size = 5.0

    bpy.ops.object.light_add(type="AREA", location=(3.2, 2.5, 2.4))
    fill = bpy.context.object
    fill.name = "rim_fill_light"
    fill.data.energy = 150
    fill.data.size = 3.5

    bpy.ops.object.camera_add(location=(0, -5.3, 1.5), rotation=(math.radians(74), 0, 0))
    camera = bpy.context.object
    camera.name = "preview_camera"
    bpy.context.scene.camera = camera
    direction = Vector((0, 0, 0.1)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def build_model(product):
    import bpy

    clear_scene()
    if product["kind"] == "solder":
        build_solder_jar(product)
    elif product["kind"] == "red_bottle":
        build_red_bottle(product)
    else:
        build_red_syringe(product)

    add_lighting_and_camera()
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 96
    bpy.context.scene.view_settings.view_transform = "Filmic"

    output_path = os.path.join(MODEL_DIR, f"{product['slug']}.glb")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )
    return output_path


def main():
    ensure_dirs()
    outputs = [build_model(product) for product in PRODUCTS]
    print("\n".join(outputs))


if __name__ == "__main__":
    main()
