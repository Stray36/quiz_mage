import logging
import PyPDF2
import io
import base64
from pdf2image import convert_from_bytes
from PIL import Image

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_file, selected_pages=None):
    """
    从PDF文件提取文本
    
    Args:
        pdf_file: PDF文件对象
        selected_pages: 选定的页面列表，如果为None，提取所有页面
        
    Returns:
        提取的文本
    """
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        
        # 如果未指定页面，则提取全部页面
        if selected_pages is None:
            selected_pages = range(len(pdf_reader.pages))
        
        # 只提取选定页面的文本
        for page_num in selected_pages:
            if 0 <= page_num < len(pdf_reader.pages):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        
        logger.info(f"成功从PDF中提取了{len(text)}个字符，共{len(selected_pages)}页")
        return text
    except Exception as e:
        logger.error(f"PDF文本提取失败: {str(e)}")
        raise

def generate_pdf_previews(pdf_file):
    """
    生成PDF文件每一页的预览图
    
    Args:
        pdf_file: PDF文件对象
        
    Returns:
        包含每一页预览图base64编码和页数的列表
    """
    try:
        # 保存PDF文件到临时内存对象
        pdf_bytes = io.BytesIO(pdf_file.read())
        pdf_file.seek(0)  # 重置文件指针，以便后续还能读取
        
        # 将PDF转换为图片
        images = convert_from_bytes(pdf_bytes.getvalue(), dpi=72)  # 低DPI以加快速度，足够预览使用
        
        previews = []
        for i, image in enumerate(images):
            # 调整图片大小以优化传输
            width, height = image.size
            ratio = min(300 / width, 400 / height)
            new_size = (int(width * ratio), int(height * ratio))
            image = image.resize(new_size, Image.LANCZOS)
            
            # 转换为base64
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG", quality=70)
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            previews.append({
                "page": i,
                "image": f"data:image/jpeg;base64,{img_base64}"
            })
        
        logger.info(f"成功生成PDF预览图，共{len(previews)}页")
        return previews
    except Exception as e:
        logger.error(f"生成PDF预览图失败: {str(e)}")
        raise