T = int(input())
for tc in range(1, T + 1):
    N = int(input())
    # 방 번호가 1번부터 시작하므로, 인덱스를 맞추기 위해 앞에 [0]을 넣어줍니다.
    # 이렇게 하면 P[2]가 2번 방의 이동 정보가 되어 보기가 편합니다.
    P = [0] + list(map(int, input().split()))
    
    # 각 방을 몇 번 방문했는지 기록하는 리스트 (0으로 초기화)
    # 방 번호 1~N을 다 쓰기 위해 크기를 N+1로 만듭니다.
    visited = [0] * (N + 1)
    
    curr = 1      # 현재 방 번호
    moves = 0     # 총 이동 횟수
    
    # 마지막 방(N)에 도착할 때까지 무한 반복
    while curr < N:
        moves += 1  # 포탈 이동 1회 추가
        
        if curr == 1:
            # 1번 방은 항상 다음 방(2번)으로 이동
            curr += 1
        else:
            # 2번 ~ N-1번 방 규칙
            if visited[curr] == 0:
                # [처음 방문] 함정 발동! 
                visited[curr] = 1   # 방문 도장 찍기
                curr = P[curr]      # 지정된 왼쪽 방으로 튕겨 나감
            else:
                # [두 번째 이상 방문] 하이패스!
                # 이미 방문한 적이 있다면 다음 방으로 이동
                curr += 1
                
    print(f"#{tc} {moves}")