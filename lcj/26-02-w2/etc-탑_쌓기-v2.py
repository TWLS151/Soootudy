'''
접근 
# 1. 각 탑의 최저층부터 무거운 화물을 쌓자 -> How?

# 2. 화물 무게를 내림차순으로 정렬
# ex. 5 4 3 2 1

# 3. 주어진 조건에 따른 탑 층수 리스트를 오름차순으로 제작
ex. 3층탑 2층탑 -> 1층*2, 2층*2, 3층*1
--> 1 1 2 2 3

# 2, 3을 인덱스 따라 곱하면 끗
'''

T = int(input()) # tc

def stacking_block(N, w1, w2):

    freight = list(map(int, input().split())) # 화물 무게 (list), 길이 N
    freight.sort(reverse=True)    
    
    height = []
    total = 0

    # 화물 높이 수 리스트 만들기 -> 이거 걍 while 썼으면 됐잖아 창준아..
    for floor in (w1, w2):
        i = 1
        for _ in range(floor):
            height.append(i) # 탑의 높이만큼 반복하며 순서대로 1, 2, 3, ...층을 제작
            i += 1
            
    height.sort() # 화물 높이를 오름차순 정렬
    
    for idx in range(N): # 화물 칸 수만큼
        total += (freight[idx]*height[idx]) # (최대-> 최소 화물) * (저층 -> 고층)
                                            # 계산하는 total은 자연스레 최소비용이 됨
        
    return total


for tc in range(1, T+1):

    N, W1, W2 = map(int, input().split())

    result = stacking_block(N, W1, W2)
    
    print(f"#{tc} {result}")