# 환상의 나라로 오세요~ 아 놀이공원 가고싶다
# 롯데월드라도 가실분

T = int(input())

def dfs(idx, left, total):
    global max_total

    # 1. 가지치기 1 : 2개 값이 남았고, 최대 점수를 얻어도 최고점이 안된다면 pass

    if len(left) == 2 and (total + max(left)*2) < max_total: 
        return
        
    # 2. 종료 조건 : 남은 풍선이 없을 때
    if not left:                            
        max_total = max(total, max_total)
        return

    # 3. 케이스에 따른 사격 점수 계산

    # (1) 왼쪽 끝 값이면
    if idx == 0 and len(left) > 1:
        now_left = left[idx+1:] # 첫 번째 값을 제외한 남은 풍선들

        for i in range(len(now_left)):
            dfs(i, now_left, total + left[idx+1]) # 오른쪽 풍선을 더해준 뒤 다음 탐색으로

    # (2) 오른쪽 끝 값이면
    elif idx == len(left)-1 and len(left) > 1:
        now_left = left[:idx] # 끝 값을 제외한 남은 풍선들
        for i in range(len(now_left)):
            dfs(i, now_left, total + left[idx-1])

    # (3) 중간 값이면

    elif 0 < idx < len(left)-1:
        now_left = left[:idx] + left[idx+1:]    # 해당 풍선을 제외한 남은 풍선들

        for i in range(len(now_left)):
            dfs(i, now_left, (total + left[idx-1]*left[idx+1]))

    # (4) 마지막 하나 남았다면

    elif len(left) == 1:
        now_left = []
        dfs(0, [], total + left[0])


for tc in range(1, T+1):

    N = int(input())
    arr = list(map(int, input().split()))
    max_total = 0

    for i in range(N):
        dfs(i, arr, 0)

    print(f"#{tc} {max_total}")